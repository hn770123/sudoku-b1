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
     * 9x9のグリッドを生成し、各セルに入力フィールドを配置
     */
    createBoard() {
        const board = document.getElementById('sudoku-board');
        board.innerHTML = '';
        this.cells = [];

        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.dataset.index = i;
            
            // 数字のみ入力可能
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value && !/^[1-9]$/.test(value)) {
                    e.target.value = '';
                }
            });

            cell.appendChild(input);
            board.appendChild(cell);
            this.cells.push({ cell, input });
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
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            const value = this.puzzle[row][col];
            
            const { cell, input } = this.cells[i];
            
            // クラスをリセット
            cell.className = 'sudoku-cell';
            
            if (value !== 0) {
                // 固定セル（問題の一部）
                input.value = value;
                input.disabled = true;
                cell.classList.add('fixed');
            } else {
                // 入力可能セル
                input.value = '';
                input.disabled = false;
            }
        }
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
            const { cell, input } = this.cells[i];

            // 固定セルはスキップ
            if (input.disabled) continue;

            const userValue = input.value ? parseInt(input.value) : 0;
            
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
