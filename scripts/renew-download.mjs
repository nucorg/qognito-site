// Operator only. Verify the customer's identity and order before renewal.
// Prints a parameter-free UUID-only SQL command; never exposes a token or email.
const id=process.argv[2];
if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id||''))throw new Error('Order UUID required');
console.log(`UPDATE sales_orders SET renew_requested=1,next_attempt_at=0 WHERE id='${id}' AND status='paid';`);
