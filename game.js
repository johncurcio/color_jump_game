let game;
let score = 0;
let scoreText = "";
 
// global game options
let gameOptions = {
    gravity: 4,
    ballSpeed: 4,
    jumpForce: 30,
    bars: 6,
    barColors: [0x2B98D1, 0x43D451, 0xFFF8F0, 0xF82991, 0xF79702, 0xFCD201]
}
 
const LEFT = 0;
const RIGHT = 1;
 
window.onload = function() {
 
    let gameConfig = {
        type: Phaser.AUTO,
        width: 750,
        height: 1334,
        backgroundColor: 0x181818,//0xFFF8F0,
        scene: playGame,
 
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    x: 0,
                    y: gameOptions.gravity
                }
            }
        }
    }
 
    game = new Phaser.Game(gameConfig);
 
    // giving focus to the frame (if any) where the game is running in
    window.focus();
 
    // pure javascript to scale the canvas
    resize();
    window.addEventListener("resize", resize, false);
}
 
class playGame extends Phaser.Scene {
    constructor(){
        super("PlayGame");
    }
 
    preload(){
        this.load.image("wall", "assets/wall.png");
        this.load.image("ball", "assets/ball.png");
        this.load.spritesheet("coin", "assets/coin_sprite.png", { frameWidth: 50, frameHeight: 50 } );
    }

    create(){
        this.leftWalls = [];
        this.rightWalls = [];
 
        for(let i = 0; i < gameOptions.bars; i++){
            this.leftWalls[i] = this.addWall(i, LEFT);
            this.rightWalls[i] = this.addWall(i, RIGHT);
        }
 
        this.ball = this.matter.add.image(game.config.width / 4, game.config.height / 2, "ball");
        this.ball.setCircle()
 
        // adding the coin, no matter where, we'll set its position later
        this.coin = this.matter.add.sprite(0, 0, "coin");
        this.coin.setCircle();
        this.coin.setStatic(true);
        // setting coin body as sensor. Will fire collision events without actually collide
        this.coin.body.isSensor = true;
        this.coin.body.label = "coin";

        var coinsAnimation = this.anims.create({
            key: 'spin',
            frames: this.anims.generateFrameNumbers('coin'),
            frameRate: 16,
            repeat: -1
        });

        this.coin.play('spin');
 
        // this method will randomly place the coin
        this.placeCoin();
 
        // setting ball velocity (horizontal, vertical)
        this.ball.setVelocity(gameOptions.ballSpeed, 0);
 
        // waiting for pointer down input to call "jump" method
        this.input.on("pointerdown", this.jump, this);
 
        // waiting for a "collisionstart" event. "e" is the event, "b1" and "b2" the bodies
        this.matter.world.on("collisionstart", function (e, b1, b2) {
            if(b1.label == "leftwall" || b2.label == "leftwall"){
                this.handleWallCollision(LEFT, b1, b2);
            }

            if(b1.label == "rightwall" || b2.label == "rightwall"){
                this.handleWallCollision(RIGHT, b1, b2);
            }
 
            if(b1.label == "coin" || b2.label == "coin"){
                // update score
                score += 10;
                scoreText.setText('Score: ' + score);
                // add new coin
                this.placeCoin();
            }
        }, this);

        this.paintWalls(this.leftWalls);
        this.paintWalls(this.rightWalls);

        scoreText = this.add.text(48, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });
    }
 
    addWall(wallNumber, side){
        // getting "wall" preloaded image
        let wallTexture = this.textures.get("wall");
        let wallHeight = game.config.height / gameOptions.bars;
        let wallX = side * game.config.width + wallTexture.source[0].width / 2 - wallTexture.source[0].width * side;
        let wallY = wallHeight * wallNumber + wallHeight / 2;
 
        // adding the wall
        let wall = this.matter.add.image(wallX, wallY, "wall");
        wall.setStatic(true);
        wall.body.label = (side == RIGHT) ? "rightwall" : "leftwall"
        wall.displayHeight = wallHeight;
        return wall
    }
 
    placeCoin(){
        this.coin.x = Phaser.Math.Between(game.config.width * 0.2, game.config.width * 0.8);
        this.coin.y = Phaser.Math.Between(game.config.height * 0.2, game.config.height * 0.8);
    }
 
    handleWallCollision(side, bodyA, bodyB){
 
        if(bodyA.color != bodyB.color){
 
            // restart the game
            this.scene.start("PlayGame");
        }
 
        this.paintWalls((side == LEFT) ? this.rightWalls : this.leftWalls);
        this.ball.setVelocity(gameOptions.ballSpeed, this.ball.body.velocity.y);
    }
 
    // method to paint the walls, in the argument the array of walls
    paintWalls(walls){
        walls.forEach(function(wall){
 
            let color = Phaser.Math.RND.pick(gameOptions.barColors);
 
            // tinting the wall
            wall.setTint(color);
 
            // also assigning the wall body a custom "color" property
            wall.body.color = color;
        });
 
        let randomWall = Phaser.Math.RND.pick(walls);
        this.ball.setTint(randomWall.body.color);
        this.ball.body.color = randomWall.body.color;
    }
 
    // method to jump
    jump(){
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, -gameOptions.jumpForce);
    }
 
    // method to be called at each frame
    update(){
        var offset = 50;
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, this.ball.body.velocity.y);
 
        // if the ball flies off the screen...
        if(this.ball.y < -offset || this.ball.y > game.config.height + offset){
 
            // restart the game
            this.scene.start("PlayGame");
        }
    }
};
 
// pure javascript to resize the canvas and scale the game
function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}