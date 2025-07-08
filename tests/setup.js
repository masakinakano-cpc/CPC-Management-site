// テスト環境の設定
process.env.NODE_ENV = 'test';
process.env.PORT = 5002;
process.env.DB_PATH = ':memory:'; // メモリ内SQLiteを使用

// テスト用のタイムアウト設定
jest.setTimeout(10000);

// グローバルテスト設定
global.console = {
    ...console,
    // テスト中のログ出力を抑制（エラーは表示）
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // error: jest.fn(), // エラーは表示する
};
