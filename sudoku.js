/**
 * 数独ゲームのメインクラス
 * 数独パズルの生成、表示、検証を行う
 */
class SudokuGame {
    /**
     * コンストラクタ - ゲームの初期化
     */
    constructor() {
        // 数独のボード（解答）
        this.solution = [];
        // ユーザーに表示するボード（問題）
        this.puzzle = [];
        // 難易度レベル
        this.difficulty = '';
        // セル要素の参照を保持
        this.cells = [];
        // 選択されているセルのインデックス
        this.selectedCellIndex = null;
        
        this.init();
    }

    /**
     * 初期化処理
     * UIの構築とイベントリスナーの設定
     */
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.generateNewPuzzle();
    }

    /**
     * 数独ボードのUIを作成
     * 9x9のグリッドを生成し、各セルに数字表示用のdivを配置
     */
    createBoard() {
        const board = document.getElementById('sudoku-board');
        board.innerHTML = '';
        this.cells = [];

        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            
            const display = document.createElement('div');
            display.className = 'cell-display';
            display.dataset.index = i;
            
            // セルクリック時の選択処理
            cell.addEventListener('click', () => {
                if (!cell.classList.contains('fixed')) {
                    this.selectCell(i);
                }
            });

            cell.appendChild(display);
            board.appendChild(cell);
            this.cells.push({ cell, display });
        }
    }

    /**
     * イベントリスナーの設定
     * ボタンのクリックイベントとPWAのインストールイベントを設定
     */
    setupEventListeners() {
        document.getElementById('regenerate-btn').addEventListener('click', () => {
            this.generateNewPuzzle();
        });

        document.getElementById('check-btn').addEventListener('click', () => {
            this.checkSolution();
        });

        // 番号ボタンのイベントリスナー
        const numberButtons = document.querySelectorAll('.number-btn');
        numberButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const number = btn.dataset.number;
                this.inputNumber(number);
            });
        });

        // PWAインストールイベント
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('install-container').style.display = 'block';
        });

        document.getElementById('install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('install-container').style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }

    /**
     * セルを選択
     * @param {number} index - セルのインデックス
     */
    selectCell(index) {
        // 以前の選択を解除
        if (this.selectedCellIndex !== null) {
            this.cells[this.selectedCellIndex].cell.classList.remove('selected');
        }
        
        // 新しいセルを選択
        this.selectedCellIndex = index;
        this.cells[index].cell.classList.add('selected');
        
        // 番号ボタンの状態を更新
        this.updateNumberButtons();
    }

    /**
     * 番号ボタンの有効/無効を更新
     * 選択されたセルが属する3x3ブロック内の既存数字を確認
     */
    updateNumberButtons() {
        const numberButtons = document.querySelectorAll('.number-btn');
        
        // セルが選択されていない場合はすべて無効化
        if (this.selectedCellIndex === null) {
            numberButtons.forEach(btn => btn.disabled = true);
            return;
        }
        
        // 選択されたセルの行、列、3x3ブロックを取得
        const row = Math.floor(this.selectedCellIndex / 9);
        const col = this.selectedCellIndex % 9;
        const blockRow = Math.floor(row / 3) * 3;
        const blockCol = Math.floor(col / 3) * 3;
        
        // 3x3ブロック内の既存の数字を収集
        const existingNumbers = new Set();
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cellRow = blockRow + i;
                const cellCol = blockCol + j;
                const cellIndex = cellRow * 9 + cellCol;
                const value = this.cells[cellIndex].display.textContent;
                if (value) {
                    existingNumbers.add(value);
                }
            }
        }
        
        // ボタンの有効/無効を設定
        numberButtons.forEach(btn => {
            const number = btn.dataset.number;
            btn.disabled = existingNumbers.has(number);
        });
    }

    /**
     * 選択されたセルに数字を入力
     * @param {string} number - 入力する数字（1-9）
     */
    inputNumber(number) {
        if (this.selectedCellIndex === null) return;
        
        const { cell, display } = this.cells[this.selectedCellIndex];
        
        // 固定セルには入力できない
        if (cell.classList.contains('fixed')) return;
        
        // 入力しようとしている数字が正解かチェック
        const row = Math.floor(this.selectedCellIndex / 9);
        const col = this.selectedCellIndex % 9;
        const correctAnswer = this.solution[row][col];
        
        if (parseInt(number) !== correctAnswer) {
            // 間違った答えの場合、数字を入力せず色で警告
            cell.classList.remove('correct');
            cell.classList.add('error');
            
            // エラーメッセージを表示
            this.showMessage('不正解です。正解の数字を選んでください。', 'error');
            
            // 1秒後に色を戻す
            setTimeout(() => {
                if (display.textContent === '') {
                    cell.classList.remove('error');
                }
            }, 1000);
            
            // 2秒後にメッセージを消す
            setTimeout(() => {
                this.showMessage('', '');
            }, 2000);
            
            return; // 数字を入力しない
        }
        
        // 正解の場合のみ数字を入力
        display.textContent = number;
        
        // エラー・正解のクラスをリセット
        cell.classList.remove('correct', 'error');
        
        // 番号ボタンの状態を更新
        this.updateNumberButtons();
    }

    /**
     * 新しい数独パズルを生成
     * 進捗表示を行いながら、完全なボードを作成してから間引く
     */
    async generateNewPuzzle() {
        const progressContainer = document.getElementById('progress-container');
        const progressText = document.getElementById('progress-text');
        const regenerateBtn = document.getElementById('regenerate-btn');
        
        // 生成中の表示
        progressContainer.style.display = 'block';
        progressText.textContent = '生成中...';
        regenerateBtn.disabled = true;
        document.getElementById('difficulty-level').textContent = '-';
        this.showMessage('', '');

        // 最低限のウェイトを入れて進捗を見せる
        await this.sleep(100);

        // 完全なボードを生成
        progressText.textContent = '解答を作成中...';
        this.solution = this.generateCompleteSudoku();
        await this.sleep(50);

        // 問題を作成（間引き）
        progressText.textContent = '問題を作成中...';
        const result = this.createPuzzle();
        this.puzzle = result.puzzle;
        this.difficulty = result.difficulty;
        await this.sleep(50);

        // UIを更新
        this.displayPuzzle();
        document.getElementById('difficulty-level').textContent = this.difficulty;
        
        // 完了
        progressContainer.style.display = 'none';
        regenerateBtn.disabled = false;
    }

    /**
     * スリープ関数
     * @param {number} ms - スリープする時間（ミリ秒）
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 完全な数独ボードを生成
     * @returns {number[][]} 9x9の完成した数独ボード
     */
    generateCompleteSudoku() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    }

    /**
     * ボードを再帰的に埋める
     * @param {number[][]} board - 数独ボード
     * @returns {boolean} 埋められたかどうか
     */
    fillBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (let num of numbers) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (this.fillBoard(board)) {
                                return true;
                            }
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * 配列をシャッフル
     * @param {Array} array - シャッフルする配列
     * @returns {Array} シャッフルされた配列
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    /**
     * 指定された位置に数字を置けるか検証
     * @param {number[][]} board - 数独ボード
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {number} num - 配置する数字
     * @returns {boolean} 配置可能かどうか
     */
    isValid(board, row, col, num) {
        // 行のチェック
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }

        // 列のチェック
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }

        // 3x3ブロックのチェック
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }

        return true;
    }

    /**
     * 完成したボードから数字を間引いて問題を作成
     * @returns {Object} パズルと難易度を含むオブジェクト
     */
    createPuzzle() {
        const puzzle = this.solution.map(row => [...row]);
        
        // 間引く数を決定（難易度に影響）
        const cellsToRemove = 40 + Math.floor(Math.random() * 21); // 40-60個を間引く
        const positions = [];
        
        // すべてのセル位置を配列に格納
        for (let i = 0; i < 81; i++) {
            positions.push(i);
        }
        
        // ランダムに位置を選択
        const shuffledPositions = this.shuffleArray(positions);
        
        // 指定された数だけセルを空にする
        for (let i = 0; i < cellsToRemove; i++) {
            const pos = shuffledPositions[i];
            const row = Math.floor(pos / 9);
            const col = pos % 9;
            puzzle[row][col] = 0;
        }

        // 難易度を判定（間引いた数で判定）
        let difficulty;
        if (cellsToRemove < 45) {
            difficulty = '簡単';
        } else if (cellsToRemove < 52) {
            difficulty = '普通';
        } else {
            difficulty = '難しい';
        }

        return { puzzle, difficulty };
    }

    /**
     * パズルをUIに表示
     * 固定セルと入力可能セルを区別して表示
     */
    displayPuzzle() {
        // 選択状態をリセット
        this.selectedCellIndex = null;
        
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const value = this.puzzle[row][col];
            
            const { cell, display } = this.cells[i];
            
            // クラスをリセット
            cell.className = 'sudoku-cell';
            
            if (value !== 0) {
                // 固定セル（問題の一部）
                display.textContent = value;
                cell.classList.add('fixed');
            } else {
                // 入力可能セル
                display.textContent = '';
            }
        }
        
        // 番号ボタンの状態を更新
        this.updateNumberButtons();
    }

    /**
     * ユーザーの解答をチェック
     * 正解・不正解をUIでフィードバック
     */
    checkSolution() {
        let allCorrect = true;
        let allFilled = true;

        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const { cell, display } = this.cells[i];

            // 固定セルはスキップ
            if (cell.classList.contains('fixed')) continue;

            const userValue = display.textContent ? parseInt(display.textContent) : 0;
            
            if (userValue === 0) {
                allFilled = false;
                cell.classList.remove('correct', 'error');
            } else if (userValue === this.solution[row][col]) {
                cell.classList.remove('error');
                cell.classList.add('correct');
            } else {
                cell.classList.remove('correct');
                cell.classList.add('error');
                allCorrect = false;
            }
        }

        // 結果メッセージを表示
        if (!allFilled) {
            this.showMessage('まだ空きマスがあります', 'info');
        } else if (allCorrect) {
            this.showMessage('おめでとうございます！正解です！', 'success');
        } else {
            this.showMessage('間違いがあります。赤いマスを確認してください。', 'error');
        }
    }

    /**
     * メッセージを表示
     * @param {string} text - 表示するメッセージ
     * @param {string} type - メッセージのタイプ（success/error/info）
     */
    showMessage(text, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = text;
        messageEl.className = 'message';
        if (type) {
            messageEl.classList.add(type);
        }
    }
}

// ページ読み込み時にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
