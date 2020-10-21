// 「アステロイド」もどき (コアの仕組みのみ実装)
// 上下左右矢印キーで移動、"X"キーでシュート

let shipSp;
let shipAnimation;

let bulletsGroup;
let asteroidsGroup;

let shipImage, bulletImage, particleImage, spaceImage;
const MARGIN = 40;

function preload() {
  bulletImage = loadImage('assets/bullet/bullet.png');
  shipImage = loadImage('assets/ship/ship0001.png');
  particleImage = loadImage('assets/particle/particle.png');
  spaceImage = loadImage('assets/spaceBG.png');
  shipAnimation = loadAnimation('assets/ship/ship0002.png', 'assets/ship/ship0007.png')
}

function setup() {
  createCanvas(800, 600);
  // 宇宙船スプライトの作成
  shipSp = createSprite(width / 2, height / 2);
  // 宇宙船スプライトのプロパティを設定
  shipSp.maxSpeed = 6;
  shipSp.friction = 0.02;
  shipSp.setCollider('circle', 0, 0, 20);

  // 推進しないとき用のイメージ
  shipSp.addImage('normal', shipImage);
  // 推進するときに使用するthrustアニメーション
  shipSp.addAnimation('thrust', shipAnimation);
  // 隕石のグループ
  asteroidsGroup = new Group();
  // 弾のグループ
  bulletsGroup = new Group();

  // キャンバス外も含むランダムな位置に隕石スプライトを8個作成
  for (let i = 0; i < 8; i++) {
    const ang = random(360);
    // -600から1400の間の数値
    const px = width / 2 + 1000 * cos(radians(ang));
    // -700から1300の間の数値
    const py = height / 2 + 1000 * sin(radians(ang));
    // typeが3の隕石スプライトを(px, py)に作成する
    createAsteroid(3, px, py);
  }
}

// 渡されたtypeの隕石を、(x,y)位置に作成する
// typeは3,2,1の３種類
function createAsteroid(type, x, y) {
  const asteroid = createSprite(x, y);
  // 隕石の画像は３種類ある。それをランダムに選んで隕石のイメージにする。
  const img = loadImage('assets/asteroid/asteroid' + floor(random(0, 3)) + '.png');
  asteroid.addImage(img);
  // typeが大きいほど、スピードは遅い。移動の方向はランダム
  asteroid.setSpeed(2.5 - (type / 2), random(360));
  // 自転するスピード
  asteroid.rotationSpeed = 0.5;
  //a.debug = true;
  // カスタムプロパティ。asteroidHit()で使用する
  asteroid.type = type;
  // typeが小さいほどサイズも小さい
  if (type == 2)
    asteroid.scale = 0.6;
  if (type == 1)
    asteroid.scale = 0.3;
  // 質量をサイズに比例させる
  asteroid.mass = 2 + asteroid.scale;
  asteroid.setCollider('circle', 0, 0, 50);
  // 隕石グループに追加
  asteroidsGroup.add(asteroid);
  return asteroid;
}

function draw() {
  image(spaceImage, 0, 0);
  // キャンバス上部に文字を表示
  fill(255);
  textAlign(CENTER);
  text('Controls: Arrow Keys + X', width / 2, 20);
  // 論理の更新
  update();
  drawSprites();
}

function update() {
  // 画面の外に出たら、画面の逆側に再登場させる
  spritesWarp();
  // 隕石グループが弾グループに重なったら、asteroidHitコールバック関数を呼び出す
  asteroidsGroup.overlap(bulletsGroup, asteroidHit);
  // 隕石グループ同士は跳ね返る
  asteroidsGroup.bounce(asteroidsGroup);
  // 宇宙船スプライトは隕石グループと跳ね返る
  shipSp.bounce(asteroidsGroup);
  // キーボード操作
  shipControl(shipSp);
}

// 全スプライト(宇宙船、弾も含む)を走査して、
// 画面の外に出たら、画面の逆側に再登場させる
function spritesWarp() {
  for (let i = 0; i < allSprites.length; i++) {
    const s = allSprites[i];
    if (s.position.x < -MARGIN) s.position.x = width + MARGIN;
    if (s.position.x > width + MARGIN) s.position.x = -MARGIN;
    if (s.position.y < -MARGIN) s.position.y = height + MARGIN;
    if (s.position.y > height + MARGIN) s.position.y = -MARGIN;
  }
}

// 隕石グループが弾グループに重なったら呼び出されるコールバック関数
function asteroidHit(asteroid, bullet) {
  // 作成する次のタイプ => より小さな隕石にする
  var newType = asteroid.type - 1;
  // より小さな隕石を２つ、より大きな隕石の位置に作成
  if (newType > 0) {
    createAsteroid(newType, asteroid.position.x, asteroid.position.y);
    createAsteroid(newType, asteroid.position.x, asteroid.position.y);
  }

  // 爆破で散らばる破片を小さなスプライトで表現する
  for (var i = 0; i < 10; i++) {
    // パーティクルスプライトを10個作成
    var p = createSprite(bullet.position.x, bullet.position.y);
    p.addImage(particleImage);
    // 速いスピードで四方に散らばって、すぐ消える
    p.setSpeed(random(3, 5), random(360));
    p.friction = 0.05;
    p.life = 15;
  }
  // 重なりが生じた対象の弾スプライトと隕石スプライトを削除
  bullet.remove();
  asteroid.remove();
}

// キーボード操作
function shipControl(sp) {
  // 宇宙船スプライトのキー操作
  // 左矢印キーで4度反時計回りに回転
  if (keyDown(LEFT_ARROW)) {
    sp.rotation -= 4;
  }
  // 右矢印キーで4度時計回りに回転
  if (keyDown(RIGHT_ARROW)) {
    sp.rotation += 4;
  }
  // 上矢印キーで、現在の回転の方向にスピードを0.2追加し、
  // 推進アニメーションに変更
  if (keyDown(UP_ARROW)) {
    sp.addSpeed(0.2, sp.rotation);
    sp.changeAnimation('thrust');
    // 上矢印キーが押されていない場合は、
  }
  else {
    // 今のアニメーションがnormalアニメーションでないなら
    if (sp.getAnimationLabel() !== 'normal') {
      // normalアニメーショに変更
      sp.changeAnimation('normal');
    }
  }
  // Xキーが押されたら(１回だけの処理)
  if (keyWentDown('x')) {
    const bulletSp = createSprite(sp.position.x, sp.position.y);
    bulletSp.addImage(bulletImage);
    // 宇宙船スプライトのスピードより10速くする
    bulletSp.setSpeed(10 + sp.getSpeed(), sp.rotation);
    bulletSp.life = 30;
    bulletsGroup.add(bulletSp);
  }
}
