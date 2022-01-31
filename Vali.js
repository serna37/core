/*
==================================================
バリデータの共通処理
==================================================
*/
export default class Vali {
  constructor(){};

  /*
  ==================================================

  ★扱うオブジェクトサンプルはForm.jsを参照

  ★バリデーション条件の一覧
  ========================================
  null: NULLの場合エラー
  empty: NULLと空文字の場合エラー
  blank: NULLと空文字と、空白文字のみの場合エラー
  num: nullでない数値のみ許可
  str: nullでない文字列のみ許可
  min: 文字数or数値('str' or 'num'), 最小値を引数で指定、最小値 "より下" でエラー、nullでもエラー
  max: 文字数or数値('str' or 'num'), 最大値を引数で指定、最大値 "より上" でエラー、nullでもエラー
  range: 文字数or数値, 最小値, 最大値を引数で指定。range(type, min, max)とする。nullでもエラー
  reg: regの引数を正規表現ルールとしてバリデート、nullでもエラー
  func: funcの引数を関数として発火する、nullでもエラー
  ========================================

  ★全パラでバリデーションOKの場合 → trueを返却
  ★1つ以上がバリデーションNGの場合 → NG項目のエラーメッセージを以下のように返却
  [{'key': 'test', 'eMsgs': ['●●は必須です。', '●●は～']},
  {'key': 'test', 'eMsgs': ['●●は必須です。', '●●は～']}, ... ]

  ★実行するサンプル
  // Form.js通りの連想配列を作成
  let form = {'key': 'sample', 'disp': ......};
  // バリデーションを実行
  let errMsgObj = $$.Vali.exe(form);
  // オブジェクトのエラーメッセージを取得
  errMsgObj.forEach(v => console.log(v['eMsgs']));
  // 最初からエラメのみ取得
  $$.Vali.flat(form).forEach(v => console.log(v));

  ==================================================
  */

  /* ==================== バリデーション条件 ==================== */
  null = (disp, post) => {
    return post == null
      ? `${disp}は必須です。`
      : true;
  };

  empty = (disp, post) => {
    let nullChk = this.null(disp, post);
    if (typeof nullChk == 'string') {
      return nullChk;
    }
    return post == ''
      ? `${disp}は空文字にしないでください。`
      : true;
  };

  blank = (disp, post) => {
    let emptyChk = this.empty(disp, post);
    if (typeof emptyChk == 'string') {
      return emptyChk;
    }
    return post.split('').every(v => v == ' ')
      ? `${disp}は空白にしないでください。`
      : true;
  };

  num = (disp, post) => {
    let nullChk = this.null(disp, post);
    if (typeof nullChk == 'string') {
      return nullChk;
    }
    return typeof post != 'number'
      ? `${disp}は数値です。`
      : true;
  };

  str = (disp, post) => {
    let nullChk = this.null(disp, post);
    if (typeof nullChk == 'string') {
      return nullChk;
    }
    return typeof post != 'string'
      ? `${disp}は文字列です。`
      : true;
  };

  min = (type, n) => {
    return (disp, post) => {
      let nullChk = this.null(disp, post);
      if (typeof nullChk == 'string') {
        return nullChk;
      }
      if (type == 'num') {
        return post >= n ? true : `${disp}は${n}以上にしてください。`;
      }
      if (type == 'str') {
        return post.length >= n ? true : `${disp}は${n}文字以上にしてください。`;
      }
    };
  };

  max = (type, n) => {
    return (disp, post) => {
      let nullChk = this.null(disp, post);
      if (typeof nullChk == 'string') {
        return nullChk;
      }
      if (type == 'num') {
        return Number(post) <= n ? true : `${disp}は${n}以下にしてください。`;
      }
      if (type == 'str') {
        return post.length <= n ? true : `${disp}は${n}文字以下にしてください。`;
      }
    };
  };

  range = (type, min, max) => {
    return (disp, post) => {
      let minChk = this.min(type, min);
      let maxChk = this.max(type, max);
      if (!(typeof minChk(disp, post) != 'string' && typeof maxChk(disp, post) != 'string')) {
        if (type == 'num') {
          return `${disp}は${min}以上${max}以下です。`;
        }
        if (type == 'str') {
          return `${disp}は${min}桁以上${max}桁以下です。`;
        }
      }
      return true;
    };
  };

  reg = r => {
    return (disp, post) => {
      let nullChk = this.null(disp, post);
      if (typeof nullChk == 'string') {
        return nullChk;
      }
      // TODO どんなフォーマットなのかをお知らせしたいね
      return !r.test(post)
        ? `${disp}はフォーマットが不正です。`
        : true;
    };
  };

  func = f => {
    return (disp, post) => {
      let nullChk = this.null(disp, post);
      if (typeof nullChk == 'string') {
        return nullChk;
      }
      // TODO どんな条件なのかをお知らせしたいね
      return !f(post)
        ? `${disp}は条件不正です。`
        : true;
    };
  };

  /* ==================== バリデーションを実行 ==================== */
  exe = obj => {
    let eMsgs = obj.filter(v => v['pre'] !== v['post'])
      .filter(v => v['vali'] != null && v['vali'].length)
      .map(v => {
        return {
          'key': v['key'],
          'eMsgs': Array.from(new Set(
            v['vali'].map(x => x(v['disp'], v['post']))
              .filter(x => typeof x == 'string')
          ))
        };
      })
      .filter(v => v['eMsgs'].length);
    return eMsgs.length ? eMsgs : true;
  };

  /* ==================== 実行してメッセージ配列のみ返却 ==================== */
  // key情報が破棄されるので注意
  flat = obj => {
    let result = this.exe(obj);
    return result === true
      ? true
      : result.map(v => v['eMsgs']).reduce((x, y) => x.concat(y));
  };

}
