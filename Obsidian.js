// ========================================
// 共通ストレージ
// ========================================

// 呼出し元登録/削除を行う共通ストレージとなる.
let Obsidian = {
  // このcoreストレージは読み取り専用で, 汎用機能が設定されます.
  core: {
    // ========================================
    // ストレージ操作系
    // ========================================
    /**
    * 可変長引数に応じたkeyの階層で連想配列を作成.
    *
    * @param key 可変長
    * @return id文字列
    */
    generateStorage(...key) {
      Obsidian[key[0]] = {};
      key.reduce((x, y) => {
        Obsidian[x][y] = {};
      });
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
     * [sampleFunction, sampleFunction, ...]が引数となる
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
