import React, { createContext, useContext, useState, useEffect } from 'react';

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const TRANSLATIONS = {
  en: {
    // Nav
    nav_call: 'Call',
    nav_stars: 'Stars',
    nav_wallet: 'Wallet',
    nav_profile: 'My Profile',

    // Headers
    brand_sub: 'Live Call • Real Experts',
    wallet_sub: 'Wallet • Buy Coins',
    profile_sub: 'My Profile',
    vip_sub: 'VIP Membership',

    // Home
    top_experts: 'Top Experts',
    view_all: 'View All →',
    online: 'Online',
    busy: 'Busy',
    coins_per_min: 'Coins / Min',
    call_btn: 'Call',
    all_experts: 'All Experts',
    filter_online: 'Online',
    filter_popular: 'Popular',
    filter_new: 'New',
    no_favs_title: 'No Favourites Yet',
    no_favs_sub: "Tap the ⭐ star on any expert's card to save them here for quick access.",
    your_favs: 'Your Favourites',

    // Wallet
    transactions: 'Transactions',
    your_balance: 'Your Coin Balance',
    coins: 'Coins',
    buy_coins: 'Buy Coins',
    vip_shortcut_title: 'VIP Membership',
    vip_shortcut_pill: 'UP TO 1,200 COINS/DAY',
    vip_shortcut_sub: 'Get up to 1,200 free daily coins + 10% bonus on all recharges',
    upgrade_btn: 'Upgrade',
    view_vip: 'View VIP',

    // Profile
    user_id: 'User ID:',
    total_calls: 'Total Calls',
    favorites: 'Favorites',
    call_history: 'Call History',
    current_balance: 'Current Balance',
    edit_profile: 'Edit Profile',
    edit_profile_sub: 'Name, username and details',
    vip_membership: 'VIP Membership',
    vip_membership_sub: 'Silver, Gold & Diamond plans',
    trans_sub: 'Coin recharge and call spend history',
    fav_sub: 'Starred hosts & experts',
    history_sub: 'Recent video and voice calls',
    language: 'Language',
    support: 'Help & Support',
    support_sub: '24/7 customer assistance',
    about: 'About CONNECT',
    about_sub: 'Terms, privacy policy and version',
    logout: 'Log Out',

    // VIP
    vip_hero_title: 'Upgrade to CONNECT VIP',
    vip_hero_desc: 'Get highlighted call requests, 10% bonus coins, exclusive recharge deals & weekly VIP gifts.',
    choose_plan: 'Choose Your Membership Plan',
    cancel_anytime: 'Cancel anytime • Instant activation',
    activate_btn: 'Activate',
    all_benefits: 'All Exclusive VIP Benefits',
    plan_comparison: 'Plan Comparison',

    // Video Call
    connecting_call: 'Connecting Call...',
    please_wait: 'Please wait...',
    video_call: 'Video Call',
    live_video_call: 'Live Video Call',
    flip: 'Flip',
    mute: 'Mute',
    end_call: 'End',
    speaker: 'Speaker',
    video: 'Video',
    send_gift: 'Send Gift',
  },

  hi: {
    // Nav
    nav_call: 'कॉल',
    nav_stars: 'स्टार्स',
    nav_wallet: 'वॉलेट',
    nav_profile: 'मेरी प्रोफाइल',

    // Headers
    brand_sub: 'लाइव कॉल • असली एक्सपर्ट्स',
    wallet_sub: 'वॉलेट • कॉइन्स खरीदें',
    profile_sub: 'मेरी प्रोफाइल',
    vip_sub: 'वीआईपी मेंबरशिप',

    // Home
    top_experts: 'टॉप एक्सपर्ट्स',
    view_all: 'सभी देखें →',
    online: 'ऑनलाइन',
    busy: 'व्यस्त',
    coins_per_min: 'कॉइन्स / मिनट',
    call_btn: 'कॉल करें',
    all_experts: 'सभी एक्सपर्ट्स',
    filter_online: 'ऑनलाइन',
    filter_popular: 'पॉपुलर',
    filter_new: 'नए',
    no_favs_title: 'अभी कोई पसंदीदा नहीं है',
    no_favs_sub: 'किसी भी एक्सपर्ट के कार्ड पर ⭐ स्टार दबाकर उन्हें यहाँ सेव करें।',
    your_favs: 'आपके पसंदीदा',

    // Wallet
    transactions: 'लेन-देन',
    your_balance: 'आपका कॉइन बैलेंस',
    coins: 'कॉइन्स',
    buy_coins: 'कॉइन्स खरीदें',
    vip_shortcut_title: 'वीआईपी मेंबरशिप',
    vip_shortcut_pill: 'रोज 1,200 कॉइन्स तक',
    vip_shortcut_sub: 'रोज 1,200 तक मुफ्त कॉइन्स + हर रिचार्ज पर 10% बोनस पाएं',
    upgrade_btn: 'अपग्रेड करें',
    view_vip: 'वीआईपी देखें',

    // Profile
    user_id: 'यूजर आईडी:',
    total_calls: 'कुल कॉल्स',
    favorites: 'पसंदीदा',
    call_history: 'कॉल हिस्ट्री',
    current_balance: 'वर्तमान बैलेंस',
    edit_profile: 'प्रोफाइल बदलें',
    edit_profile_sub: 'नाम, यूजरनेम और जानकारी',
    vip_membership: 'वीआईपी मेंबरशिप',
    vip_membership_sub: 'सिल्वर, गोल्ड और डायमंड प्लान्स',
    trans_sub: 'कॉइन रिचार्ज और खर्च का इतिहास',
    fav_sub: 'पसंदीदा होस्ट्स और एक्सपर्ट्स',
    history_sub: 'हाल के वीडियो और वॉइस कॉल्स',
    language: 'भाषा बदलें',
    support: 'मदद और सपोर्ट',
    support_sub: '24/7 ग्राहक सहायता',
    about: 'CONNECT के बारे में',
    about_sub: 'शर्तें, गोपनीयता नीति और वर्जन',
    logout: 'लॉग आउट',

    // VIP
    vip_hero_title: 'CONNECT वीआईपी में अपग्रेड करें',
    vip_hero_desc: 'हाइलाइट की गई कॉल रिक्वेस्ट, 10% बोनस कॉइन्स और साप्ताहिक डील्स पाएं।',
    choose_plan: 'अपनी मेंबरशिप का प्लान चुनें',
    cancel_anytime: 'कभी भी कैंसिल करें • तुरंत एक्टिवेट',
    activate_btn: 'शुरू करें',
    all_benefits: 'सभी एक्सक्लूसिव वीआईपी फायदे',
    plan_comparison: 'प्लान तुलना',

    // Video Call
    connecting_call: 'कॉल कनेक्ट हो रही है...',
    please_wait: 'कृपया प्रतीक्षा करें...',
    video_call: 'वीडियो कॉल',
    live_video_call: 'लाइव वीडियो कॉल',
    flip: 'कैमरा बदलें',
    mute: 'म्यूट',
    end_call: 'समाप्त',
    speaker: 'स्पीकर',
    video: 'वीडियो',
    send_gift: 'उपहार भेजें',
  },

  mr: {
    // Nav
    nav_call: 'कॉल',
    nav_stars: 'स्टार्स',
    nav_wallet: 'वॉलेट',
    nav_profile: 'माझे प्रोफाईल',

    // Headers
    brand_sub: 'थेट कॉल • खरे तज्ज्ञ',
    wallet_sub: 'वॉलेट • कॉइन्स खरेदी करा',
    profile_sub: 'माझे प्रोफाईल',
    vip_sub: 'व्हीआयपी सदस्यता',

    // Home
    top_experts: 'टॉप तज्ज्ञ',
    view_all: 'सर्व पहा →',
    online: 'ऑनलाईन',
    busy: 'व्यस्त',
    coins_per_min: 'कॉइन्स / मिनिट',
    call_btn: 'कॉल करा',
    all_experts: 'सर्व तज्ज्ञ',
    filter_online: 'ऑनलाईन',
    filter_popular: 'लोकप्रिय',
    filter_new: 'नवीन',
    no_favs_title: 'अद्याप आवडते नाहीत',
    no_favs_sub: 'कोणत्याही तज्ज्ञाला येथे जतन करण्यासाठी ⭐ स्टार दाबा.',
    your_favs: 'तुमचे आवडते तज्ज्ञ',

    // Wallet
    transactions: 'व्यवहार',
    your_balance: 'तुमचा कॉइन शिल्लक',
    coins: 'कॉइन्स',
    buy_coins: 'कॉइन्स खरेदी करा',
    vip_shortcut_title: 'व्हीआयपी सदस्यता',
    vip_shortcut_pill: 'दररोज 1,200 कॉइन्स पर्यंत',
    vip_shortcut_sub: 'दररोज मोफत कॉइन्स + प्रत्येक रिचार्जवर 10% बोनस मिळवा',
    upgrade_btn: 'अपग्रेड करा',
    view_vip: 'व्हीआयपी पहा',

    // Profile
    user_id: 'युझर आयडी:',
    total_calls: 'एकूण कॉल्स',
    favorites: 'आवडते',
    call_history: 'कॉल इतिहास',
    current_balance: 'सध्याची शिल्लक',
    edit_profile: 'प्रोफाईल संपादित करा',
    edit_profile_sub: 'नाव, युझरनेम आणि तपशील',
    vip_membership: 'व्हीआयपी सदस्यता',
    vip_membership_sub: 'सिल्व्हर, गोल्ड आणि डायमंड प्लॅन्स',
    trans_sub: 'कॉइन रिचार्ज आणि खर्चाचा इतिहास',
    fav_sub: 'आवडते होस्ट्स आणि तज्ज्ञ',
    history_sub: 'अलीकडील व्हिडिओ आणि व्हॉइस कॉल्स',
    language: 'भाषा निवडा',
    support: 'मदत आणि सपोर्ट',
    support_sub: '24/7 ग्राहक सहाय्य',
    about: 'CONNECT बद्दल',
    about_sub: 'अटी, गोपनीयता धोरण आणि आवृत्ती',
    logout: 'लॉग आउट',

    // VIP
    vip_hero_title: 'CONNECT व्हीआयपी वर अपग्रेड करा',
    vip_hero_desc: 'प्राधान्य कॉल, 10% बोनस कॉइन्स आणि खास ऑफर्स मिळवा.',
    choose_plan: 'तुमचा सदस्यता प्लॅन निवडा',
    cancel_anytime: 'केव्हाही रद्द करा • झटपट सक्रिय',
    activate_btn: 'सक्रिय करा',
    all_benefits: 'सर्व व्हीआयपी फायदे',
    plan_comparison: 'प्लॅन तुलना',

    // Video Call
    connecting_call: 'कॉल जोडत आहे...',
    please_wait: 'कृपया थांबा...',
    video_call: 'व्हिडिओ कॉल',
    live_video_call: 'थेट व्हिडिओ कॉल',
    flip: 'कॅमेरा बदला',
    mute: 'म्यूट',
    end_call: 'समाप्त',
    speaker: 'स्पीकर',
    video: 'व्हिडिओ',
    send_gift: 'भेट पाठवा',
  },

  bn: {
    // Nav
    nav_call: 'কল',
    nav_stars: 'স্টার্স',
    nav_wallet: 'ওয়ালেট',
    nav_profile: 'আমার প্রোফাইল',

    // Headers
    brand_sub: 'লাইভ কল • আসল বিশেষজ্ঞ',
    wallet_sub: 'ওয়ালেট • কয়েন কিনুন',
    profile_sub: 'আমার প্রোফাইল',
    vip_sub: 'ভিআইপি মেম্বারশিপ',

    // Home
    top_experts: 'শীর্ষ বিশেষজ্ঞ',
    view_all: 'সব দেখুন →',
    online: 'অনলাইন',
    busy: 'ব্যস্ত',
    coins_per_min: 'কয়েন / মিনিট',
    call_btn: 'কল করুন',
    all_experts: 'সকল বিশেষজ্ঞ',
    filter_online: 'অনলাইন',
    filter_popular: 'জনপ্রিয়',
    filter_new: 'নতুন',
    no_favs_title: 'এখনও প্রিয় নেই',
    no_favs_sub: 'দ্রুত অ্যাক্সেসের জন্য যেকোনো কার্ডে ⭐ স্টার চাপুন।',
    your_favs: 'আপনার প্রিয়',

    // Wallet
    transactions: 'লেনদেন',
    your_balance: 'আপনার কয়েন ব্যালেন্স',
    coins: 'কয়েন',
    buy_coins: 'কয়েন কিনুন',
    vip_shortcut_title: 'ভিআইপি মেম্বারশিপ',
    vip_shortcut_pill: 'প্রতিদিন ১,২০০ কয়েন পর্যন্ত',
    vip_shortcut_sub: 'দৈনিক ফ্রি কয়েন + রিচার্জে ১০% অতিরিক্ত বোনাস পান',
    upgrade_btn: 'আপগ্রেড',
    view_vip: 'ভিআইপি দেখুন',

    // Profile
    user_id: 'ইউজার আইডি:',
    total_calls: 'মোট কল',
    favorites: 'প্রিয়',
    call_history: 'কল হিস্ট্রি',
    current_balance: 'বর্তমান ব্যালেন্স',
    edit_profile: 'প্রোফাইল পরিবর্তন',
    edit_profile_sub: 'নাম এবং বিবরণ',
    vip_membership: 'ভিআইপি মেম্বারশিপ',
    vip_membership_sub: 'সিলভার, গোল্ড ও ডায়মন্ড প্ল্যান',
    trans_sub: 'কয়েন রিচার্জ ও ব্যয়ের হিসাব',
    fav_sub: 'সংরক্ষিত হোস্ট ও বিশেষজ্ঞ',
    history_sub: 'সাম্প্রতিক কলসমূহ',
    language: 'ভাষা পরিবর্তন',
    support: 'সাহায্য ও সাপোর্ট',
    support_sub: '২৪/৭ গ্রাহক সহায়তা',
    about: 'CONNECT সম্পর্কে',
    about_sub: 'শর্তাবলী ও সংস্করণ',
    logout: 'লগ আউট',

    // VIP
    vip_hero_title: 'CONNECT ভিআইপিতে আপগ্রেড করুন',
    vip_hero_desc: 'অগ্রাধিকার কল, ১০% বোনাস কয়েন ও বিশেষ ডিল পান।',
    choose_plan: 'আপনার মেম্বারশিপ প্ল্যান বেছে নিন',
    cancel_anytime: 'যেকোনো সময় বাতিলযোগ্য • তাত্ক্ষণিক সক্রিয়',
    activate_btn: 'সক্রিয় করুন',
    all_benefits: 'সকল ভিআইপি সুবিধা',
    plan_comparison: 'প্ল্যান তুলনা',

    // Video Call
    connecting_call: 'কল যুক্ত হচ্ছে...',
    please_wait: 'অনুগ্রহ করে অপেক্ষা করুন...',
    video_call: 'ভিডিও কল',
    live_video_call: 'লাইভ ভিডিও কল',
    flip: 'ক্যামেরা পরিবর্তন',
    mute: 'মিউট',
    end_call: 'সমাপ্ত',
    speaker: 'স্পিকার',
    video: 'ভিডিও',
    send_gift: 'উপহার পাঠান',
  },

  te: {
    // Nav
    nav_call: 'కాల్',
    nav_stars: 'స్టార్స్',
    nav_wallet: 'వాలెట్',
    nav_profile: 'నా ప్రొఫైల్',

    // Headers
    brand_sub: 'లైవ్ కాల్ • నిజమైన నిపుణులు',
    wallet_sub: 'వాలెట్ • కాయిన్స్ కొనండి',
    profile_sub: 'నా ప్రొఫైల్',
    vip_sub: 'వీఐపీ సభ్యత్వం',

    // Home
    top_experts: 'టాప్ నిపుణులు',
    view_all: 'అన్నీ చూడండి →',
    online: 'ఆన్‌లైన్',
    busy: 'బిజీ',
    coins_per_min: 'కాయిన్స్ / నిమిషం',
    call_btn: 'కాల్ చేయండి',
    all_experts: 'అందరు నిపుణులు',
    filter_online: 'ఆన్‌లైన్',
    filter_popular: 'పాపులర్',
    filter_new: 'కొత్తవి',
    no_favs_title: 'ఇంకా ఇష్టమైనవి లేవు',
    no_favs_sub: 'త్వరిత యాక్సెస్ కోసం ఏదైనా కార్డ్‌పై ⭐ స్టార్ నొక్కండి.',
    your_favs: 'మీకు ఇష్టమైనవి',

    // Wallet
    transactions: 'లావాదేవీలు',
    your_balance: 'మీ కాయిన్ బ్యాలెన్స్',
    coins: 'కాయిన్స్',
    buy_coins: 'కాయిన్స్ కొనండి',
    vip_shortcut_title: 'వీఐపీ సభ్యత్వం',
    vip_shortcut_pill: 'రోజుకు 1,200 కాయిన్స్ వరకు',
    vip_shortcut_sub: 'ప్రతిరోజూ ఉచిత కాయిన్స్ + రీఛార్జ్‌పై 10% బోనస్ పొందండి',
    upgrade_btn: 'అప్‌గ్రేడ్',
    view_vip: 'వీఐపీ చూడండి',

    // Profile
    user_id: 'యూజర్ ఐడీ:',
    total_calls: 'మొత్తం కాల్స్',
    favorites: 'ఇష్టమైనవి',
    call_history: 'కాల్ చరిత్ర',
    current_balance: 'ప్రస్తుత బ్యాలెన్స్',
    edit_profile: 'ప్రొఫైల్ సవరించండి',
    edit_profile_sub: 'పేరు, యూజర్‌నేమ్ మరియు వివరాలు',
    vip_membership: 'వీఐపీ సభ్యత్వం',
    vip_membership_sub: 'సిల్వర్, గోల్డ్ & డైమండ్ ప్లాన్లు',
    trans_sub: 'కాయిన్ రీఛార్జ్ & ఖర్చు వివరాలు',
    fav_sub: 'ఇష్టమైన నిపుణులు',
    history_sub: 'ఇటీవలి కాల్స్',
    language: 'భాషను ఎంచుకోండి',
    support: 'సహాయం & మద్దతు',
    support_sub: '24/7 కస్టమర్ కేర్',
    about: 'CONNECT గురించి',
    about_sub: 'నిబంధనలు మరియు వెర్షన్',
    logout: 'లాగ్ అవుట్',

    // VIP
    vip_hero_title: 'CONNECT వీఐపీకి అప్‌గ్రేడ్ అవ్వండి',
    vip_hero_desc: 'ప్రాధాన్యత కాల్స్, 10% బోనస్ కాయిన్స్ మరియు ప్రత్యేక ఆఫర్లు.',
    choose_plan: 'మీ మెంబర్‌షిప్ ప్లాన్ ఎంచుకోండి',
    cancel_anytime: 'ఎప్పుడైనా రద్దు చేయవచ్చు • తక్షణ యాక్టివేషన్',
    activate_btn: 'ప్రారంభించండి',
    all_benefits: 'అన్ని వీఐపీ ప్రయోజనాలు',
    plan_comparison: 'ప్లాన్ల పోలిక',

    // Video Call
    connecting_call: 'కాల్ కనెక్ట్ అవుతోంది...',
    please_wait: 'దయచేసి వేచి ఉండండి...',
    video_call: 'వీడియో కాల్',
    live_video_call: 'లైవ్ వీడియో కాల్',
    flip: 'కెమెరా మార్చండి',
    mute: 'మ్యూట్',
    end_call: 'ముగించండి',
    speaker: 'స్పీకర్',
    video: 'వీడియో',
    send_gift: 'గిఫ్ట్ పంపండి',
  },

  ta: {
    // Nav
    nav_call: 'அழைப்பு',
    nav_stars: 'ஸ்டார்ஸ்',
    nav_wallet: 'வாலட்',
    nav_profile: 'என் சுயவிவரம்',

    // Headers
    brand_sub: 'நேரலை அழைப்பு • உண்மையான நிபுணர்கள்',
    wallet_sub: 'வாலட் • நாணயங்களை வாங்கவும்',
    profile_sub: 'என் சுயவிவரம்',
    vip_sub: 'விஐபி உறுப்பினர்',

    // Home
    top_experts: 'சிறந்த நிபுணர்கள்',
    view_all: 'அனைத்தும் காண்க →',
    online: 'ஆன்லைன்',
    busy: 'பிஸியாக',
    coins_per_min: 'நாணயங்கள் / நிமிடம்',
    call_btn: 'அழைக்கவும்',
    all_experts: 'அனைத்து நிபுணர்கள்',
    filter_online: 'ஆன்லைன்',
    filter_popular: 'பிரபலமான',
    filter_new: 'புதியது',
    no_favs_title: 'விருப்பங்கள் எதுவும் இல்லை',
    no_favs_sub: 'விரைவான அணுகலுக்கு ஏதேனும் கார்டில் ⭐ ஸ்டாரைத் தட்டவும்.',
    your_favs: 'உங்கள் விருப்பங்கள்',

    // Wallet
    transactions: 'பரிவர்த்தனைகள்',
    your_balance: 'உங்கள் நாணய இருப்பு',
    coins: 'நாணயங்கள்',
    buy_coins: 'நாணயங்களை வாங்கவும்',
    vip_shortcut_title: 'விஐபி உறுப்பினர்',
    vip_shortcut_pill: 'தினமும் 1,200 வரை',
    vip_shortcut_sub: 'இலவச தினசரி நாணயங்கள் + 10% போனஸ் பெறுங்கள்',
    upgrade_btn: 'மேம்படுத்து',
    view_vip: 'விஐபி காண்க',

    // Profile
    user_id: 'பயனர் ஐடி:',
    total_calls: 'மொத்த அழைப்புகள்',
    favorites: 'விருப்பங்கள்',
    call_history: 'அழைப்பு வரலாறு',
    current_balance: 'தற்போதைய இருப்பு',
    edit_profile: 'சுயவிவரத்தைத் திருத்து',
    edit_profile_sub: 'பெயர் மற்றும் விவரங்கள்',
    vip_membership: 'விஐபி உறுப்பினர்',
    vip_membership_sub: 'சில்வர், கோல்ட் & டைமண்ட்',
    trans_sub: 'நாணய செலவு வரலாறு',
    fav_sub: 'விருப்பமான நிபுணர்கள்',
    history_sub: 'சமீபத்திய அழைப்புகள்',
    language: 'மொழியை மாற்றவும்',
    support: 'உதவி மற்றும் ஆதரவு',
    support_sub: '24/7 வாடிக்கையாளர் சேவை',
    about: 'CONNECT பற்றி',
    about_sub: 'விதிமுறைகள் மற்றும் பதிப்பு',
    logout: 'வெளியேறு',

    // VIP
    vip_hero_title: 'CONNECT விஐபிக்கு மேம்படுத்தவும்',
    vip_hero_desc: 'முன்னுரிமை அழைப்புகள், 10% போனஸ் நாணயங்கள் & சிறப்பு சலுகைகள்.',
    choose_plan: 'உங்கள் திட்டத்தைத் தேர்ந்தெடுக்கவும்',
    cancel_anytime: 'எப்போது வேண்டுமானாலும் ரத்து • உடனடி செயல்பாடு',
    activate_btn: 'செயல்படுத்து',
    all_benefits: 'அனைத்து விஐபி நன்மைகள்',
    plan_comparison: 'திட்ட ஒப்பீடு',

    // Video Call
    connecting_call: 'இணைக்கப்படுகிறது...',
    please_wait: 'காத்திருக்கவும்...',
    video_call: 'வீடியோ அழைப்பு',
    live_video_call: 'நேரலை வீடியோ அழைப்பு',
    flip: 'கேமரா மாற்று',
    mute: 'ஒலி அடக்கு',
    end_call: 'முடிக்கவும்',
    speaker: 'ஸ்பீக்கர்',
    video: 'வீடியோ',
    send_gift: 'பரிசு அனுப்பு',
  },

  gu: {
    // Nav
    nav_call: 'કૉલ',
    nav_stars: 'સ્ટાર્સ',
    nav_wallet: 'વૉલેટ',
    nav_profile: 'મારી પ્રોફાઇલ',

    // Headers
    brand_sub: 'લાઇવ કૉલ • વાસ્તવિક નિષ્ણાતો',
    wallet_sub: 'વૉલેટ • સિક્કા ખરીદો',
    profile_sub: 'મારી પ્રોફાઇલ',
    vip_sub: 'વીઆઇપી સભ્યપદ',

    // Home
    top_experts: 'ટોચના નિષ્ણાતો',
    view_all: 'બધા જુઓ →',
    online: 'ઑનલાઇન',
    busy: 'વ્યસ્ત',
    coins_per_min: 'સિક્કા / મિનિટ',
    call_btn: 'કૉલ કરો',
    all_experts: 'બધા નિષ્ણાતો',
    filter_online: 'ઑનલાઇન',
    filter_popular: 'લોકપ્રિય',
    filter_new: 'નવા',
    no_favs_title: 'હજુ કોઈ મનપસંદ નથી',
    no_favs_sub: 'ઝડપી ઍક્સેસ માટે કોઈપણ કાર્ડ પર ⭐ સ્ટાર દબાવો.',
    your_favs: 'તમારા મનપસંદ',

    // Wallet
    transactions: 'વ્યવહારો',
    your_balance: 'તમારું સિક્કા બેલેન્સ',
    coins: 'સિક્કા',
    buy_coins: 'સિક્કા ખરીદો',
    vip_shortcut_title: 'વીઆઇપી સભ્યપદ',
    vip_shortcut_pill: 'દરરોજ 1,200 સિક્કા સુધી',
    vip_shortcut_sub: 'દરરોજ મફત સિક્કા + 10% બોનસ મેળવો',
    upgrade_btn: 'અપગ્રેડ કરો',
    view_vip: 'વીઆઇપી જુઓ',

    // Profile
    user_id: 'વપરાશકર્તા આઈડી:',
    total_calls: 'કુલ કૉલ્સ',
    favorites: 'મનપસંદ',
    call_history: 'કૉલ ઇતિહાસ',
    current_balance: 'વર્તમાન બેલેન્સ',
    edit_profile: 'પ્રોફાઇલ સંપાદિત કરો',
    edit_profile_sub: 'નામ અને વિગતો',
    vip_membership: 'વીઆઇપી સભ્યપદ',
    vip_membership_sub: 'સિલ્વર, ગોલ્ડ અને ડાયમંડ પ્લાન',
    trans_sub: 'સિક્કા રિચાર્જ અને ખર્ચનો ઇતિહાસ',
    fav_sub: 'મનપસંદ નિષ્ણાતો',
    history_sub: 'તાજેતરના કૉલ્સ',
    language: 'ભાષા પસંદ કરો',
    support: 'મદદ અને સપોર્ટ',
    support_sub: '24/7 ગ્રાહક સહાય',
    about: 'CONNECT વિશે',
    about_sub: 'શરતો અને સંસ્કરણ',
    logout: 'લૉગ આઉટ',

    // VIP
    vip_hero_title: 'CONNECT વીઆઇપીમાં અપગ્રેડ કરો',
    vip_hero_desc: 'અગ્રતા કૉલ્સ, 10% બોનસ સિક્કા અને વિશેષ ઑફર્સ મેળવો.',
    choose_plan: 'તમારો પ્લાન પસંદ કરો',
    cancel_anytime: 'ગમે ત્યારે રદ કરો • ત્વરિત સક્રિય',
    activate_btn: 'સક્રિય કરો',
    all_benefits: 'બધા વીઆઇપી લાભો',
    plan_comparison: 'પ્લાનની સરખામણી',

    // Video Call
    connecting_call: 'કૉલ જોડાઈ રહ્યો છે...',
    please_wait: 'કૃપા કરીને રાહ જુઓ...',
    video_call: 'વિડિઓ કૉલ',
    live_video_call: 'લાઇવ વિડિઓ કૉલ',
    flip: 'કૅમેરા ફ્લિપ',
    mute: 'મ્યૂટ',
    end_call: 'સમાપ્ત',
    speaker: 'સ્પીકર',
    video: 'વિડિઓ',
    send_gift: 'ભેટ મોકલો',
  },

  pa: {
    // Nav
    nav_call: 'ਕਾਲ',
    nav_stars: 'ਸਟਾਰਸ',
    nav_wallet: 'ਵਾਲਿਟ',
    nav_profile: 'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ',

    // Headers
    brand_sub: 'ਲਾਈਵ ਕਾਲ • ਅਸਲ ਮਾਹਰ',
    wallet_sub: 'ਵਾਲਿਟ • ਸਿੱਕੇ ਖਰੀਦੋ',
    profile_sub: 'ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ',
    vip_sub: 'ਵੀਆਈਪੀ ਮੈਂਬਰਸ਼ਿਪ',

    // Home
    top_experts: 'ਚੋਟੀ ਦੇ ਮਾਹਰ',
    view_all: 'ਸਾਰੇ ਦੇਖੋ →',
    online: 'ਆਨਲਾਈਨ',
    busy: 'ਰੁਝੇਵੇਂ',
    coins_per_min: 'ਸਿੱਕੇ / ਮਿੰਟ',
    call_btn: 'ਕਾਲ ਕਰੋ',
    all_experts: 'ਸਾਰੇ ਮਾਹਰ',
    filter_online: 'ਆਨਲਾਈਨ',
    filter_popular: 'ਪ੍ਰਸਿੱਧ',
    filter_new: 'ਨਵੇਂ',
    no_favs_title: 'ਅਜੇ ਕੋਈ ਪਸੰਦੀਦਾ ਨਹੀਂ',
    no_favs_sub: 'ਤੁਰੰਤ ਪਹੁੰਚ ਲਈ ਕਿਸੇ ਵੀ ਕਾਰਡ ਉੱਤੇ ⭐ ਸਟਾਰ ਦਬਾਓ।',
    your_favs: 'ਤੁਹਾਡੇ ਪਸੰਦੀਦਾ',

    // Wallet
    transactions: 'ਲੈਣ-ਦੇਣ',
    your_balance: 'ਤੁਹਾਡਾ ਸਿੱਕਾ ਬਕਾਇਆ',
    coins: 'ਸਿੱਕੇ',
    buy_coins: 'ਸਿੱਕੇ ਖਰੀਦੋ',
    vip_shortcut_title: 'ਵੀਆਈਪੀ ਮੈਂਬਰਸ਼ਿਪ',
    vip_shortcut_pill: 'ਰੋਜ਼ਾਨਾ 1,200 ਸਿੱਕਿਆਂ ਤੱਕ',
    vip_shortcut_sub: 'ਰੋਜ਼ਾਨਾ ਮੁਫ਼ਤ ਸਿੱਕੇ + ਹਰ ਰੀਚਾਰਜ ਉੱਤੇ 10% ਬੋਨਸ',
    upgrade_btn: 'ਅੱਪਗ੍ਰੇਡ ਕਰੋ',
    view_vip: 'ਵੀਆਈਪੀ ਦੇਖੋ',

    // Profile
    user_id: 'ਯੂਜ਼ਰ ਆਈਡੀ:',
    total_calls: 'ਕੁੱਲ ਕਾਲਾਂ',
    favorites: 'ਪਸੰਦੀਦਾ',
    call_history: 'ਕਾਲ ਇਤਿਹਾਸ',
    current_balance: 'ਮੌਜੂਦਾ ਬਕਾਇਆ',
    edit_profile: 'ਪ੍ਰੋਫਾਈਲ ਸੰਪਾਦਿਤ ਕਰੋ',
    edit_profile_sub: 'ਨਾਮ ਅਤੇ ਵੇਰਵੇ',
    vip_membership: 'ਵੀਆਈਪੀ ਮੈਂਬਰਸ਼ਿਪ',
    vip_membership_sub: 'ਸਿਲਵਰ, ਗੋਲਡ ਅਤੇ ਡਾਇਮੰਡ',
    trans_sub: 'ਸਿੱਕਾ ਰੀਚਾਰਜ ਅਤੇ ਖਰਚ ਇਤਿਹਾਸ',
    fav_sub: 'ਪਸੰਦੀਦਾ ਮਾਹਰ',
    history_sub: 'ਹਾਲੀਆ ਕਾਲਾਂ',
    language: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    support: 'ਮਦਦ ਅਤੇ ਸਹਾਇਤਾ',
    support_sub: '24/7 ਗਾਹਕ ਸੇਵਾ',
    about: 'CONNECT ਬਾਰੇ',
    about_sub: 'ਨਿਯਮ ਅਤੇ ਸੰਸਕਰਣ',
    logout: 'ਲਾਗ ਆਉਟ',

    // VIP
    vip_hero_title: 'CONNECT ਵੀਆਈਪੀ ਵਿੱਚ ਅੱਪਗ੍ਰੇਡ ਕਰੋ',
    vip_hero_desc: 'ਤਰਜੀਹੀ ਕਾਲਾਂ, 10% ਬੋਨਸ ਸਿੱਕੇ ਅਤੇ ਵਿਸ਼ੇਸ਼ ਡੀਲਾਂ।',
    choose_plan: 'ਆਪਣਾ ਪਲਾਨ ਚੁਣੋ',
    cancel_anytime: 'ਕਦੇ ਵੀ ਰੱਦ ਕਰੋ • ਤੁਰੰਤ ਸਰਗਰਮ',
    activate_btn: 'ਸ਼ੁਰੂ ਕਰੋ',
    all_benefits: 'ਸਾਰੇ ਵੀਆਈਪੀ ਲਾਭ',
    plan_comparison: 'ਪਲਾਨ ਤੁਲਨਾ',

    // Video Call
    connecting_call: 'ਕਾਲ ਜੁੜ ਰਹੀ ਹੈ...',
    please_wait: 'ਕਿਰਪਾ ਕਰਕੇ ਉਡੀਕ ਕਰੋ...',
    video_call: 'ਵੀਡੀਓ ਕਾਲ',
    live_video_call: 'ਲਾਈਵ ਵੀਡੀਓ ਕਾਲ',
    flip: 'ਕੈਮਰਾ ਬਦਲੋ',
    mute: 'ਮਿਊਟ',
    end_call: 'ਸਮਾਪਤ',
    speaker: 'ਸਪੀਕਰ',
    video: 'ਵੀਡੀਓ',
    send_gift: 'ਤੋਹਫ਼ਾ ਭੇਜੋ',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    try {
      return localStorage.getItem('connect_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  });

  const setLanguage = (code) => {
    setCurrentLang(code);
    try {
      localStorage.setItem('connect_lang', code);
    } catch (e) {}
  };

  const t = (key, fallback = '') => {
    const langDict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return TRANSLATIONS.en[key] || fallback || key;
  };

  const currentLanguageMeta = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentLanguageMeta,
        setLanguage,
        t,
        LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if called outside provider
    return {
      currentLang: 'en',
      currentLanguageMeta: LANGUAGES[0],
      setLanguage: () => {},
      t: (key, fallback = '') => TRANSLATIONS.en[key] || fallback || key,
      LANGUAGES,
    };
  }
  return context;
}

