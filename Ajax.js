/*
==================================================
Ajaxの共通基底処理
==================================================
*/
export default class Ajax {
  constructor(){};

  // TODO GET送信
  get = () => {console.log("GET送信")};
  // TODO POST送信
  post = (req, url, func, efunc) => {
    fetch(url, {
      // FIXME ここはoiptionとして外だししたい
      method: "POST",
      body: JSON.stringify(req)
    })
    .then(data => func(JSON.parse(data)))
    .catch(e => efunc(e));
  };

  // TODO あとで消す
  test = v => (...args) => args
    .reduce((x, y) => x.concat(y))
    .forEach((e, i) => console.log(`index: ${i}, value: ${e}`));
}



// let json = {
//   id: 'test',
//   name: 'aa',
//   do: 'aa'
// };
// var url = "https://neras-sta.com/cgi-bin/text.py";
// var method = "POST";
// var headers = {
//   'Accept': 'application/json',
//   'Content-Type': 'application/json',
// };
// var body = JSON.stringify(json);
// var mhb = {method, headers, body}
// fetch(url, mhb)
// .then(v => {
//   console.log(v)
//   return v
// })
// .then(res => res.json())
// .then(v => {
//   console.log(v)
//   return v
// })
// .then(v => console.log(v))
// .catch(e => console.log(e));
