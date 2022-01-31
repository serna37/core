/*
==================================================
フォームオブジェクトの共通処理
==================================================
*/
export default class Form {
  constructor(){};

  /*
  ==================================================

  ★扱うオブジェクトサンプル
  ========================================
  let form = [
    {'key': 'key', 'disp': '論理名', 'pre': '表示値', 'post': '入力値', 'vali': []},
    {'key': 'key', 'disp': '論理名', 'pre': 'test', 'post': 'test', 'vali': [$$.Vali.null]},
    {'key': 'key', 'disp': '論理名', 'pre': 0, 'post': 5, 'vali': [$$.Vali.num]},
    {'key': 'key', 'disp': '論理名', 'pre': 0, 'post': 5, 'vali': [$$.Vali.num, $$.Vali.min('num', 0)]},
    {'key': 'key', 'disp': '論理名', 'pre': 'test', 'post': 'test11', 'vali': [$$.Vali.max('str', 10)]},
    {'key': 'key', 'disp': '論理名', 'pre': 'test', 'post': 'test11', 'vali': [$$.Vali.range('str', 1, 10)]},
    {'key': 'key', 'disp': '論理名', 'pre': 'test', 'post': 'test11', 'vali': [$$.Vali.reg(/[ABC]/)]},
    {'key': 'key', 'disp': '論理名', 'pre': 'test', 'post': 'test11', 'vali': [$$.Vali.func(v => v.length == 3)]},
  ];
  ========================================

  ★使い方
  ========================================
  key: str キー
  disp: str 画面表示の論理名
  pre: str/num 画面表示の初期値
  post: str/num 画面から入力された値
  vali: arr バリデーション条件配列(省略は要素0の配列)
  ========================================

  ★バリデーション条件の一覧はVali.jsを参照
  ==================================================
  */

  /* ==================== Formオブジェクト作成 ==================== */
  // オブジェクト1レコードを作成
  create = () => new FormObj();
  // オブジェクトを操作できるようにする
  get = obj => new FormObj(obj);

  // TODO Formの使い方をもっと洗練したい

  // 使い方サンプル
  // form.filter(v => v['key'] == 'key1')   keyで捜査対象を絞る
  //   .map(v => $$.Form.get(v).addVali($$.Vali.num).commit());   バリデーションを追加
}

/* ==================== Formオブジェクト ==================== */
// チェーンメソッドで操作できるようにするためのオブジェクト
export class FormObj {
  constructor (v) {
    this.obj = {'key': null, 'disp': null, 'pre': null, 'post': null, 'vali': null};
    this.obj = v;
  };
  obj = null;

  // keyを更新
  key = v => {
    this.obj['key'] = v;
    return this;
  };

  // dispを更新
  disp = v => {
    this.obj['disp'] = v;
    return this;
  };

  // preを更新
  pre = v => {
    this.obj['pre'] = v;
    return this;
  };

  // postを更新
  post = v => {
    this.obj['post'] = v;
    return this;
  };

  // valiを更新
  vali = v => {
    this.obj['vali'] = [v];
    return this;
  };

  // vali1を追加
  addVali = v => {
    if (this.obj['vali'] == null) {
      this.vali(v);
      return;
    }
    this.obj['vali'].push(v);
    return this;
  };

  // objを返却
  commit = () => this.obj;
};
