// Netlify Function: Handle PayU Callback (surl and furl)
const { getPayUConfig, verifyResponseHash, verifyPaymentWithPayUServer } = require('./_payu-config');
const { recordOrder, getOrder, isDuplicatePayment, generateDeliveryToken } = require('./_order-store');
const { BOOKS, BUNDLES, SERVICES } = require('./_catalog');

exports.handler = async (event, context) => {
  // PayU sends POST requests to surl/furl
  let rawBody = event.body || '';
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
  }

  // Parse Form URL-encoded parameters from PayU
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  const config = getPayUConfig();

  const {
    txnid = '',
    status = '',
    amount = '',
    productinfo = '',
    firstname = '',
    email = '',
    phone = '',
    hash = '',
    mihpayid = '',
    bank_ref_num = '',
    error_Message = '',
    additionalCharges = '',
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = ''
  } = params;

  let redirectUrl = `${config.siteUrl}/payment-status.html`;

  // If no txnid received
  if (!txnid) {
    const errorUrl = `${config.siteUrl}/payment-status.html?status=error&msg=${encodeURIComponent('No transaction ID received in gateway callback.')}`;
    return buildRedirectResponse(errorUrl);
  }

  // Pre-resolve order and product category so all branches (success, failure, cancellation) route accurately
  let existingOrder = getOrder(txnid) || {};
  let itemsPurchased = existingOrder.itemsPurchased;
  if (!itemsPurchased || itemsPurchased.length === 0) {
    itemsPurchased = reconstructItemsFromUdf(udf1);
  }
  let category = (itemsPurchased && itemsPurchased[0] && itemsPurchased[0].category) || existingOrder.productCategory || 'ebook';
  if (udf5 === 'connect' || String(txnid).startsWith('CN_')) {
    category = 'connect';
  }

  /**
   * Helper to construct category-specific status and return URLs
   */
  function getRedirectUrl({ targetCategory, status, txnid, token = '', amount = '', mihpayid = '', errorMsg = '' }) {
    if (targetCategory === 'service') {
      const base = `${config.siteUrl}/service/payment-status.html`;
      if (status === 'success') {
        return `${base}?status=success&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}`;
      } else if (status === 'cancelled') {
        return `${base}?status=cancelled&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      } else if (status === 'failed') {
        return `${base}?status=failed&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      } else if (status === 'pending') {
        return `${base}?status=pending&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    } else if (targetCategory === 'wavc') {
      const isIndexPhp = udf5 === 'index-php' || (udf1 && (udf1.includes('wavc-call-49') || udf1.includes('wavc-call-99')));
      const base = isIndexPhp ? `${config.siteUrl}/wa.vc/index.php.html` : `${config.siteUrl}/wa.vc/WA%20Meet.html`;
      if (status === 'success') {
        return `${base}?txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&status=success`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    } else if (targetCategory === 'meeting') {
      const base = `${config.siteUrl}/payment-status.html`;
      return `${base}?status=${encodeURIComponent(status)}&type=meeting&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}&msg=${encodeURIComponent(errorMsg)}`;
    } else if (targetCategory === 'connect') {
      const base = `${config.siteUrl}/connect/`;
      if (status === 'success') {
        return `${base}?status=success&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}#home`;
      }
    } else {
      // Default: eBook order (Preserves 100% backward compatibility)
      const base = `${config.siteUrl}/payment-status.html`;
      if (status === 'success') {
        return `${base}?status=success&txnid=${encodeURIComponent(txnid)}&token=${encodeURIComponent(token)}&amount=${encodeURIComponent(amount)}&mihpayid=${encodeURIComponent(mihpayid)}`;
      } else if (status === 'pending') {
        return `${base}?status=pending&txnid=${encodeURIComponent(txnid)}&amount=${encodeURIComponent(amount)}`;
      } else {
        return `${base}?status=${encodeURIComponent(status)}&txnid=${encodeURIComponent(txnid)}&msg=${encodeURIComponent(errorMsg)}`;
      }
    }
  }

  // 1. Verify reverse SHA-512 response hash
  const hashCheck = verifyResponseHash(params, config.salt);
  if (!hashCheck.isValid) {
    console.error('PAYU HASH TAMPERING DETECTED for txnid:', txnid, {
      received: hashCheck.receivedHash,
      calculated: hashCheck.calculatedHash
    });

    recordOrder(txnid, {
      txnid,
      status: 'tampered',
      tamperDetails: 'Reverse SHA-512 hash mismatch',
      rawStatus: status,
      productCategory: category
    });

    if (category === 'connect') {
      try {
        const { getDb } = require('./_connect-db');
        const db = getDb();
        await db.collection('connect_orders').doc(txnid).update({
          status: 'tampered',
          tamperDetails: 'Reverse SHA-512 hash mismatch',
          rawStatus: status,
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}
    }

    const tamperedUrl = getRedirectUrl({
      targetCategory: category,
      status: 'tampered',
      txnid,
      errorMsg: 'Security verification failed. Payment hash mismatch.'
    });
    return buildRedirectResponse(tamperedUrl);
  }

  // 2. Check duplicate payment protection
  if (isDuplicatePayment(txnid, mihpayid)) {
    console.log(`Duplicate payment notification for txnid: ${txnid}`);
    const existingOrder = getOrder(txnid) || {};
    const existingToken = generateDeliveryToken(existingOrder, config.signingSecret);
    const duplicateUrl = getRedirectUrl({
      targetCategory: category,
      status: 'success',
      txnid,
      token: existingToken,
      amount: existingOrder.amount || amount,
      mihpayid
    }) + '&duplicate=1';
    return buildRedirectResponse(duplicateUrl);
  }

  // 3. Process based on PayU status
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus === 'success') {
    // Attempt secondary Server-to-Server verification with PayU
    let serverVerificationPassed = true;
    try {
      const serverCheck = await verifyPaymentWithPayUServer({
        key: config.key,
        salt: config.salt,
        txnid,
        verifyServiceUrl: config.verifyServiceUrl
      });

      if (serverCheck.success && serverCheck.data && serverCheck.data.status === 1) {
        // Detailed transaction status from PayU postservice
        const txnDetails = serverCheck.data.transaction_details && serverCheck.data.transaction_details[txnid];
        if (txnDetails && txnDetails.status && txnDetails.status.toLowerCase() !== 'success') {
          serverVerificationPassed = false;
        }
      }
    } catch (e) {
      // In offline/mock mode or if PayU service is unreachable, proceed based on valid cryptographic reverse hash
      console.warn('PayU Server-to-Server status verification warning:', e.message);
    }

    if (!serverVerificationPassed) {
      recordOrder(txnid, {
        txnid,
        status: 'failed',
        failureReason: 'Server verification returned non-success status',
        productCategory: category
      });
      if (category === 'connect') {
        try {
          const { getDb } = require('./_connect-db');
          const db = getDb();
          await db.collection('connect_orders').doc(txnid).update({
            status: 'failed',
            failureReason: 'Server verification returned non-success status',
            updatedAt: new Date().toISOString()
          });
        } catch (e) {}
      }
      const failUrl = getRedirectUrl({
        targetCategory: category,
        status: 'failed',
        txnid,
        errorMsg: 'Payment confirmation failed verification.'
      });
      return buildRedirectResponse(failUrl);
    }

    // CONNECT Coin Recharge: Atomic Firestore Verification & Fulfilment
    if (category === 'connect') {
      const { getDb, formatReadableDate, getCanonicalPackage, getCanonicalVipPlan } = require('./_connect-db');
      const db = getDb();
      const orderDocRef = db.collection('connect_orders').doc(txnid);
      const orderSnap = await orderDocRef.get();

      let orderData = orderSnap.exists ? orderSnap.data() : null;
      if (!orderData) {
        // Resilient fallback: reconstruct from cryptographically verified UDFs or amount
        let verifiedUid = udf1 || '';
        let targetKey = udf2 || '';
        if (udf1 && udf1.includes(':')) {
          targetKey = udf1.split(':')[1];
          verifiedUid = '';
        }
        let targetPackage = getCanonicalPackage(targetKey) || getCanonicalPackage(udf2);
        let targetVip = getCanonicalVipPlan(targetKey) || getCanonicalVipPlan(udf2);

        // Fallback by amount if package key was not resolved
        if (!targetPackage && !targetVip) {
          const numAmount = parseFloat(amount || 0);
          if (Math.abs(numAmount - 19) < 0.01) targetPackage = getCanonicalPackage('connect-pack-19');
          else if (Math.abs(numAmount - 49) < 0.01) targetPackage = getCanonicalPackage('connect-pack-49');
          else if (Math.abs(numAmount - 99) < 0.01) targetPackage = getCanonicalPackage('connect-pack-99');
          else if (Math.abs(numAmount - 149) < 0.01) targetPackage = getCanonicalPackage('connect-pack-149');
          else if (Math.abs(numAmount - 199) < 0.01) targetPackage = getCanonicalPackage('connect-pack-199');
          else if (Math.abs(numAmount - 299) < 0.01) targetVip = getCanonicalVipPlan('connect-vip-gold');
          else if (Math.abs(numAmount - 399) < 0.01) targetVip = getCanonicalVipPlan('connect-vip-diamond');
        }

        // If verifiedUid is empty, try to resolve via phone number
        if (!verifiedUid && phone) {
          const cleanP = String(phone).replace(/[^0-9]/g, '').slice(-10);
          try {
            const fs = require('fs');
            const path = require('path');
            const phoneUsersRaw = fs.readFileSync(path.join(__dirname, '_phone-users.json'), 'utf8');
            const phoneMap = JSON.parse(phoneUsersRaw || '{}');
            if (phoneMap[cleanP]?.uid) {
              verifiedUid = phoneMap[cleanP].uid;
            }
          } catch (_) {}
        }
        if (!verifiedUid) {
          verifiedUid = `phone_${String(phone).replace(/[^0-9]/g, '').slice(-10) || 'user'}`;
        }

        if (verifiedUid && (targetPackage || targetVip)) {
          orderData = targetVip
            ? {
                txnid,
                uid: verifiedUid,
                orderType: 'vip',
                planId: targetVip.planId,
                packageName: targetVip.title,
                planName: targetVip.planName,
                durationDays: targetVip.durationDays,
                dailyBonusCoins: targetVip.dailyBonusCoins,
                expectedAmount: Number(targetVip.price),
                expectedCoins: 0,
                status: 'pending',
                fulfilled: false,
                createdAt: new Date().toISOString(),
                customerName: firstname || 'CONNECT VIP User',
                customerPhone: phone || '',
                customerEmail: email || '',
                category: 'connect_vip',
              }
            : {
                txnid,
                uid: verifiedUid,
                orderType: 'coins',
                packageId: targetPackage.id,
                packageName: targetPackage.title,
                expectedAmount: Number(targetPackage.price),
                expectedCoins: Number(targetPackage.coins),
                status: 'pending',
                fulfilled: false,
                createdAt: new Date().toISOString(),
                customerName: firstname || 'CONNECT User',
                customerPhone: phone || '',
                customerEmail: email || '',
                category: 'connect',
              };
          try {
            await orderDocRef.set(orderData);
          } catch (e) {}
        }
      }

      if (!orderData) {
        console.error('CONNECT Order not found in Firestore for txnid:', txnid);
        const failUrl = getRedirectUrl({
          targetCategory: 'connect',
          status: 'failed',
          txnid,
          errorMsg: 'Order record not found in system.'
        });
        return buildRedirectResponse(failUrl);
      }

      const receivedAmount = parseFloat(amount || 0);
      const expectedAmount = parseFloat(orderData.expectedAmount || 0);

      // Verify amount matches expected package price
      if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
        console.error(`CONNECT Amount mismatch for txnid ${txnid}: received ${receivedAmount}, expected ${expectedAmount}`);
        await orderDocRef.update({
          status: 'amount_mismatch',
          receivedAmount,
          expectedAmount,
          updatedAt: new Date().toISOString()
        });
        const mismatchUrl = getRedirectUrl({
          targetCategory: 'connect',
          status: 'failed',
          txnid,
          errorMsg: 'Security verification failed: payment amount mismatch.'
        });
        return buildRedirectResponse(mismatchUrl);
      }

      // Atomic wallet credit or VIP activation, ledger record, and order status update
      const isVipOrder = orderData.orderType === 'vip' || orderData.category === 'connect_vip' || Boolean(orderData.planId);
      let fulfilmentResult;
      try {
        fulfilmentResult = await db.runTransaction(async (transaction) => {
          const freshOrderSnap = await transaction.get(orderDocRef);
          let freshOrder = freshOrderSnap.exists ? freshOrderSnap.data() : orderData;
          if (!freshOrder) {
            freshOrder = orderData;
          }

          // Idempotency check: if order is already fulfilled, do not process again!
          if (freshOrder.fulfilled === true || freshOrder.status === 'success') {
            return {
              alreadyFulfilled: true,
              isVip: isVipOrder,
              planId: freshOrder.planId,
              coinsCredited: freshOrder.expectedCoins || 0,
              uid: freshOrder.uid
            };
          }

          const userDocRef = db.collection('users').doc(freshOrder.uid);
          const userSnap = await transaction.get(userDocRef);
          let userData;
          if (!userSnap.exists) {
            userData = {
              profile: {
                uid: freshOrder.uid,
                name: freshOrder.customerName || 'CONNECT User',
                phone: freshOrder.customerPhone || '',
                email: freshOrder.customerEmail || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              wallet: { coins: 0, updatedAt: new Date().toISOString() },
              ledger: [],
              favourites: [],
              purchasedPacks: [],
            };
            transaction.set(userDocRef, userData);
          } else {
            userData = userSnap.data();
          }

          const existingLedger = Array.isArray(userData.ledger) ? userData.ledger : [];

          if (isVipOrder) {
            // ── VIP Entitlement Fulfilment ──
            const nowMs = Date.now();
            const durationMs = Number(freshOrder.durationDays || 30) * 24 * 60 * 60 * 1000;
            const existingExpiryMs = userData.vip?.entitlement?.expiryDateMs ||
              (userData.vip?.entitlement?.expiryDate ? new Date(userData.vip.entitlement.expiryDate).getTime() : 0);

            // Extend if currently active; otherwise start from now
            const baseMs = (existingExpiryMs && existingExpiryMs > nowMs) ? existingExpiryMs : nowMs;
            const newExpiryMs = baseMs + durationMs;
            const newExpiryDate = new Date(newExpiryMs).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const newExpiryIso = new Date(newExpiryMs).toISOString();

            const planName = freshOrder.planName ||
              (freshOrder.planId === 'silver' ? 'Silver VIP' : freshOrder.planId === 'diamond' ? 'Diamond VIP' : 'Gold VIP');

            const entitlement = {
              planId: freshOrder.planId,
              planName,
              status: 'active',
              active: true,
              durationDays: freshOrder.durationDays,
              dailyBonusCoins: freshOrder.dailyBonusCoins,
              activatedAtMs: nowMs,
              activatedAt: new Date(nowMs).toISOString(),
              expiryDateMs: newExpiryMs,
              expiryDate: newExpiryDate,
              expiryDateIso: newExpiryIso,
              paymentRef: {
                txnid,
                mihpayid: mihpayid || '',
                bank_ref_num: bank_ref_num || '',
                amountPaid: expectedAmount,
                paidAt: new Date().toISOString(),
              },
            };

            const ledgerEntry = {
              id: `TXN-VIP-${txnid}`,
              type: 'vip_purchase',
              title: `Purchased ${planName} (${freshOrder.durationDays} Days)`,
              description: `PayU payment confirmed for ${planName}`,
              coins: 0,
              amount: 0,
              isCredit: true,
              balanceAfter: Number(userData.wallet?.coins || 0),
              status: 'Completed',
              date: formatReadableDate(new Date()),
              timestamp: new Date().toISOString(),
              metadata: {
                txnid,
                mihpayid: mihpayid || '',
                bank_ref_num: bank_ref_num || '',
                planId: freshOrder.planId,
                planName,
                amountPaid: expectedAmount,
                durationDays: freshOrder.durationDays,
              },
            };

            // Atomic Subcollection Ledger Reference & Idempotency Check
            const ledgerDocRef = userDocRef.collection('ledger').doc(`TXN-VIP-${txnid}`);
            const existingTxnSnap = await transaction.get(ledgerDocRef);
            if (existingTxnSnap.exists || existingLedger.some(e => e.id === `TXN-VIP-${txnid}` || e.metadata?.txnid === txnid)) {
              return { alreadyFulfilled: true, isVip: true, planId: freshOrder.planId, uid: freshOrder.uid };
            }

            transaction.update(userDocRef, {
              'vip.entitlement': entitlement,
              'profile.isVip': true,
              'profile.vipPlan': planName,
              'profile.vipPlanId': freshOrder.planId,
              'profile.vipExpiry': entitlement.expiryDate,
              'profile.vipExpiryMs': entitlement.expiryDateMs,
              ledger: [ledgerEntry, ...existingLedger].slice(0, 100),
              updatedAt: new Date().toISOString(),
            });

            // Atomically write immutable transaction into users/{uid}/ledger/{txnId}
            transaction.set(ledgerDocRef, ledgerEntry);

            transaction.update(orderDocRef, {
              status: 'success',
              fulfilled: true,
              fulfilledAt: new Date().toISOString(),
              mihpayid: mihpayid || '',
              bank_ref_num: bank_ref_num || '',
              entitlement,
              updatedAt: new Date().toISOString(),
            });

            return { success: true, isVip: true, planId: freshOrder.planId, planName, uid: freshOrder.uid };
          } else {
            // ── Coin Recharge Fulfilment ──
            const currentCoins = Number(userData.wallet?.coins || 0);
            const coinsToAdd = Number(freshOrder.expectedCoins || 0);
            const newBalance = currentCoins + coinsToAdd;

            const ledgerEntry = {
              id: `TXN-PAYU-${txnid}`,
              type: 'purchase',
              title: `Coin Recharge - ${coinsToAdd} Coins (₹${expectedAmount})`,
              description: `PayU payment confirmed for ${freshOrder.packageName || 'Coin Pack'}`,
              amount: coinsToAdd,
              coins: coinsToAdd,
              isCredit: true,
              balanceAfter: newBalance,
              status: 'Completed',
              date: formatReadableDate(new Date()),
              timestamp: new Date().toISOString(),
              metadata: {
                txnid,
                mihpayid: mihpayid || '',
                bank_ref_num: bank_ref_num || '',
                packageId: freshOrder.packageId,
                amountPaid: expectedAmount,
              },
            };

            // Atomic Subcollection Ledger Reference & Idempotency Check
            const ledgerDocRef = userDocRef.collection('ledger').doc(`TXN-PAYU-${txnid}`);
            const existingTxnSnap = await transaction.get(ledgerDocRef);
            if (existingTxnSnap.exists || existingLedger.some(e => e.id === `TXN-PAYU-${txnid}` || e.metadata?.txnid === txnid)) {
              return { alreadyFulfilled: true, isVip: false, coinsCredited: coinsToAdd, uid: freshOrder.uid };
            }

            const existingPacks = Array.isArray(userData.purchasedPacks) ? userData.purchasedPacks : [];
            const updatedPacks = freshOrder.packageId && !existingPacks.includes(freshOrder.packageId)
              ? [...existingPacks, freshOrder.packageId]
              : existingPacks;

            transaction.update(userDocRef, {
              'wallet.coins': newBalance,
              'wallet.updatedAt': new Date().toISOString(),
              purchasedPacks: updatedPacks,
              ledger: [ledgerEntry, ...existingLedger].slice(0, 100),
              updatedAt: new Date().toISOString(),
            });

            // Atomically write immutable transaction into users/{uid}/ledger/{txnId}
            transaction.set(ledgerDocRef, ledgerEntry);

            transaction.update(orderDocRef, {
              status: 'success',
              fulfilled: true,
              fulfilledAt: new Date().toISOString(),
              mihpayid: mihpayid || '',
              bank_ref_num: bank_ref_num || '',
              coinsCredited: coinsToAdd,
              balanceAfter: newBalance,
              updatedAt: new Date().toISOString(),
            });

            return { success: true, isVip: false, coinsCredited: coinsToAdd, newBalance, uid: freshOrder.uid };
          }
        });
      } catch (txErr) {
        console.error('Firestore fulfilment error:', txErr);
        const failUrl = getRedirectUrl({
          targetCategory: 'connect',
          status: 'failed',
          txnid,
          errorMsg: 'Transaction fulfilment failed. Please contact support.'
        });
        return buildRedirectResponse(failUrl);
      }

      recordOrder(txnid, {
        txnid,
        status: 'success',
        amount: amount || expectedAmount,
        mihpayid,
        bank_ref_num,
        productCategory: isVipOrder ? 'connect_vip' : 'connect',
        fulfilled: true,
        paidAt: new Date().toISOString()
      });

      const { generateDeliveryToken } = require('./_order-store');
      const deliveryToken = generateDeliveryToken({
        txnid,
        status: 'success',
        amount: amount || expectedAmount,
        itemsPurchased: [{
          id: orderData.packageId || (orderData.orderType === 'vip' ? `connect-vip-${orderData.planId}` : 'connect-pack-19'),
          title: orderData.packageName || 'Coin Pack',
          price: amount || expectedAmount,
          category: isVipOrder ? 'connect_vip' : 'connect',
          coins: fulfilmentResult.coinsCredited || orderData.expectedCoins || 50,
          planId: orderData.planId || null,
        }],
        productCategory: isVipOrder ? 'connect_vip' : 'connect',
        customerPhone: phone || orderData.customerPhone || '',
        customerName: firstname || orderData.customerName || '',
        mihpayid,
      }, config.signingSecret);

      const baseSuccessUrl = getRedirectUrl({
        targetCategory: 'connect',
        status: 'success',
        txnid,
        token: deliveryToken,
        amount,
        mihpayid
      });
      const connectSuccessUrl = isVipOrder
        ? `${baseSuccessUrl}&type=vip&plan=${encodeURIComponent(orderData.planId || 'gold')}#home`
        : `${baseSuccessUrl}&coins=${fulfilmentResult.coinsCredited || orderData.expectedCoins}#home`;
      return buildRedirectResponse(connectSuccessUrl);
    }

    // Update and record verified order (eBooks, Services, etc.)
    const updatedOrder = recordOrder(txnid, {
      txnid,
      status: 'success',
      amount: amount || existingOrder.amount,
      mihpayid,
      bank_ref_num,
      customerName: firstname || existingOrder.customerName,
      customerEmail: email || existingOrder.customerEmail,
      customerPhone: phone || udf2 || existingOrder.customerPhone,
      productinfo,
      itemsPurchased,
      productCategory: category,
      fulfilled: true,
      paidAt: new Date().toISOString()
    });

    // Generate tamper-proof cryptographic delivery token
    const token = generateDeliveryToken(updatedOrder, config.signingSecret);

    // Route customer back to the category-specific verified experience
    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: 'success',
      txnid,
      token,
      amount,
      mihpayid
    });
    return buildRedirectResponse(redirectUrl);

  } else if (normalizedStatus === 'pending') {
    recordOrder(txnid, {
      txnid,
      status: 'pending',
      amount,
      mihpayid,
      customerName: firstname,
      customerEmail: email,
      customerPhone: phone,
      productCategory: category
    });

    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: 'pending',
      txnid,
      amount
    });
    return buildRedirectResponse(redirectUrl);

  } else {
    // Payment failure or cancellation
    const isCancelled = normalizedStatus === 'cancel' ||
                        normalizedStatus === 'cancelled' ||
                        String(params.unmappedstatus || '').toLowerCase().includes('cancel') ||
                        String(error_Message || '').toLowerCase().includes('cancel');

    const failureStatus = isCancelled ? 'cancelled' : 'failed';
    const errorMsg = error_Message || (isCancelled ? 'Payment was cancelled by user.' : 'Payment was declined or unsuccessful.');

    recordOrder(txnid, {
      txnid,
      status: failureStatus,
      amount,
      mihpayid,
      error_Message: errorMsg,
      productCategory: category
    });

    if (category === 'connect') {
      try {
        const { getDb } = require('./_connect-db');
        const db = getDb();
        await db.collection('connect_orders').doc(txnid).update({
          status: failureStatus,
          error_Message: errorMsg,
          mihpayid: mihpayid || '',
          updatedAt: new Date().toISOString()
        });
      } catch (e) {}
    }

    redirectUrl = getRedirectUrl({
      targetCategory: category,
      status: failureStatus,
      txnid,
      errorMsg
    });
    return buildRedirectResponse(redirectUrl);
  }
};

/**
 * Reconstruct purchased items from UDF1 when memory cache was cleared
 */
function reconstructItemsFromUdf(udf1) {
  if (!udf1) return [];
  const [type, id] = udf1.split(':');
  if (type === 'single' && BOOKS[id]) {
    return [{ id, title: BOOKS[id].title, price: BOOKS[id].price, category: 'ebook' }];
  } else if (type === 'bundle' && BUNDLES[id]) {
    return BUNDLES[id].bookIds.map(bId => ({
      id: bId,
      title: BOOKS[bId] ? BOOKS[bId].title : bId,
      price: BOOKS[bId] ? BOOKS[bId].price : 0,
      category: 'ebook'
    }));
  } else if ((type === 'service' || type === 'wavc' || type === 'meeting' || type === 'connect') && SERVICES[id]) {
    return [{
      id: SERVICES[id].id,
      title: SERVICES[id].title,
      price: SERVICES[id].price,
      category: SERVICES[id].category,
      planId: SERVICES[id].planId || null,
      coins: SERVICES[id].coins || 0
    }];
  }
  return [];
}

/**
 * Returns HTTP 303 with HTML fallback for seamless browser redirection
 */
function buildRedirectResponse(targetUrl) {
  const isService = targetUrl.includes('/service/');
  const isWavc = targetUrl.includes('wa.vc');
  const heading = isService ? 'Finalizing Your Service Order...' : (isWavc ? 'Finalizing Your Video Call Order...' : 'Finalizing Your eBook Order...');
  const subtext = isService
    ? 'Please wait while we verify your transaction and prepare your service access.'
    : (isWavc
      ? 'Please wait while we verify your transaction and prepare your call session.'
      : 'Please wait while we verify your transaction and prepare your digital downloads.');

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=${targetUrl}">
  <title>Redirecting to Order Status...</title>
  <style>
    body {
      background: #030712;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      padding: 2.5rem;
      border-radius: 16px;
      max-width: 420px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a { color: #fbbf24; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h3 style="margin-top:0;">${heading}</h3>
    <p style="color:#94a3b8;font-size:0.95rem;">${subtext}</p>
    <p style="font-size:0.85rem;"><a href="${targetUrl}">Click here if not redirected automatically</a></p>
  </div>
  <script>window.location.replace("${targetUrl}");</script>
</body>
</html>`;

  return {
    statusCode: 303,
    headers: {
      'Location': targetUrl,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: htmlBody
  };
}
