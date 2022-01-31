// ========================================
// 共通ストレージ
// ========================================

// 呼出し元登録/削除を行う共通ストレージとなる.
// ※注意 関数の登録は可能ですが、Obsidian.core.setを実行すると削除されます.
let Obsidian = {
  // このcoreストレージは読み取り専用で, 汎用機能が設定されます.
  core: {
    // ========================================
    // ストレージ操作系
    // ========================================
    /**
    * 可変長引数に応じたkeyの階層で連想配列を作成(初期化).
    *
    * @param key 可変長
    * @return id文字列
    */
    generate(...key) {
      let tmp = Obsidian;
      key.forEach(v => {
        tmp[v] = {};
        tmp = tmp[v];
      });
    },
    /**
    * 可変長引数に応じたkeyを作成.
    * 既存のkeyに影響を与えない
    *
    * @param key 可変長
    * @return void
    */
    addKey(...key) {
      // 未作成の階層は初期化
      let tmp = Obsidian;
      key.forEach(v => {
        if (tmp[v] == undefined) {
          tmp[v] = {};
        }
        tmp = tmp[v];
      });
    },
    /**
    * 可変長引数に応じたkeyに値を登録(上書き).
    * TODO 時間がかかります.
    * XXX 使用非推奨
    * addKeyを実行後に直接追加してください.
    * Obsidian.addKey(k1, k2)
    * Obsidian[k1][k2] = val
    *
    * @param val 値
    * @param key 可変長
    * @return void
    */
    set(val, ...key) {
      // 未作成の階層は初期化
      let tmp = Obsidian;
      key.forEach(v => {
        if (tmp[v] == undefined) {
          tmp[v] = {};
        }
        tmp = tmp[v];
      });
      // セット
      let st = JSON.stringify(Obsidian);
      let stock = [];
      key.forEach(v => {
        let rg = st.match(new RegExp(`(.*${v})(.*)`));
        stock.push(rg[1]);
        st = rg[2];
      });
      // ":{最下層keyの値}...を
      // ":val...に置換
      stock.push(st.replace(/":({[^}]*})/, `":"${val}"`));
      Obsidian = JSON.parse(stock.join(''));
      console.log(Obsidian)
      Obsidian.core = this; // coreが{}となるので再登録
      // TODO JSONにするタイミングで関数が消えちゃう.
      // 関数をあらかじめ退避してから再登録するか?
    },
    /**
    * 可変長引数に応じたkeyでObsidianから値を取得.
    * ないkeyのストレージは作成, 既存のkeyに影響を与えない.
    *
    * @param key 可変長
    * @return 値, 無ければストレージを作成し{}をセット, nullを返却
    */
    get(...key) {
      // 未作成の階層は初期化
      let tmp = Obsidian;
      key.forEach(v => {
        if (tmp[v] == undefined) {
          tmp[v] = {};
        }
        tmp = tmp[v];
      });
      if (Object.keys(tmp).length == 0) {
        return null;
      }
      return tmp;
    },
    // ========================================
    // 直列実行
    // ========================================
    /**
     * 関数を直列に同期実行. 以下の形式の関数の配列を引数とする.
     * (v, r) => {任意の実装, r(v)を実行したタイミングで完了}
     * 例)
     * const sampleFunction = (v, r) => {
     *   // 任意の実装
     *   setTimeout(() => {
     *     // 遅延して完了し, 次の関数へ
           r(v);
     *   }, 1000);
     * }
     * [sampleFunction, sampleFunction, ...]が引数となる.
     *
     * @param arr 直列実行する関数の配列 (index順)
     * @return arrを全て実行したあとのPromiseを返却
     */
    seriesExe(arr) {
      return arr
        .reduce((x, y) => x.then(v => new Promise(r => y(v, r))),
        Promise.resolve());
    },

  },
};
export default Obsidian;
