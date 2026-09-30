export function setupWhitepaperForm() {
  const form = document.querySelector<HTMLFormElement>('#whitepaper-form');
  if (!form) return;
  const button = document.querySelector<HTMLButtonElement>('#submit-lead')!;
  const fields = document.querySelector<HTMLFieldSetElement>('#lead-fields')!;
  const status = document.querySelector<HTMLElement>('#form-status')!;
  const success = document.querySelector<HTMLElement>('#download-success')!;
  const download = document.querySelector<HTMLAnchorElement>('#pdf-download')!;
  const requestId = crypto.randomUUID();
  let busy = false;
  button.disabled = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('botcheck')) {
      status.textContent = 'La demande n’a pas été transmise. Contactez contact@qognito.io si le problème persiste.';
      return;
    }
    data.delete('botcheck');
    data.set('contact_requested', data.get('contact_requested') === 'oui' ? 'oui' : 'non');
    data.set('request_id', requestId);
    data.set('submitted_at', new Date().toISOString());
    // Aucune URL complète, donnée de navigation ou information personnelle dans la provenance.
    const campaign = new URLSearchParams(location.search).get('source');
    data.set('source', ['linkedin-j0', 'linkedin-j4', 'linkedin-j10', 'signature'].includes(campaign || '') ? campaign! : 'site');
    busy = true;
    fields.disabled = true;
    status.textContent = 'Transmission en cours…';
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Transmission refusée');
      download.href = form.dataset.download!;
      form.reset();
      form.hidden = true;
      status.textContent = '';
      success.hidden = false;
      success.focus();
    } catch {
      status.textContent = 'La transmission n’a pas pu être confirmée. Vos champs sont conservés : réessayez ou écrivez à contact@qognito.io. Si vous avez déjà envoyé une demande, elle peut avoir été reçue.';
      status.focus();
      fields.disabled = false;
      busy = false;
    }
  });
}
