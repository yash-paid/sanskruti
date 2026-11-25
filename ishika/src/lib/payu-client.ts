/**
 * Client-Side Helper to submit payment form to PayU Hosted Checkout.
 */
export function submitPayUPayment(
  actionUrl: string,
  params: Record<string, string>
): void {
  if (typeof window === 'undefined') return;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = actionUrl;
  form.style.display = 'none';

  for (const [key, value] of Object.entries(params)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value ?? '');
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
