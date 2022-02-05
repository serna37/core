// ========================================
// Ajaxの共通基底処理
// ========================================
const Ajax = {

  post(request, func, efunc) {
    const url = 'https://neras-sta.com/cgi-bin/api.py';
    const method = "POST";
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    const body = JSON.stringify(request);
    // exec
    fetch(url, {method, headers, body})
      .then(res => res.json())
      .then(v => func(v))
      .catch(e => {
        console.error(e);
        if (efunc) {
          efunc(e);
        }
      });
  },
}
export default Ajax;
