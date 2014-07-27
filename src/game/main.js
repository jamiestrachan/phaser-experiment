var SPEED = 200;
var GRAVITY = 900;
var JET = 420;
var OPENING = 200;
var SPAWN_RATE = 1.25; 

var state = {
    preload: function(){
        this.load.image("wall", "assets/wall.png");
        this.load.image("background", "assets/background-texture.png");
        this.load.spritesheet("player", "/assets/player.png", 48, 48);

        this.load.audio("jet", "/assets/jet.wav");
        this.load.audio("score", "/assets/score.wav");
        this.load.audio("hurt", "/assets/hurt.wav");
    },
    create: function(){
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = GRAVITY;

        this.background = this.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');

        this.walls = this.add.group();

        this.jetSnd = this.add.audio('jet');
        this.scoreSnd = this.add.audio('score');
        this.hurtSnd = this.add.audio('hurt');

        this.player = this.add.sprite(0,0,'player');
        this.player.animations.add('fly', [0,1,2], 10, true);
        this.physics.arcade.enableBody(this.player);
        this.player.body.collideWorldBounds = true;

        this.scoreText = this.add.text(
            this.world.centerX,
            this.world.height/5,
            "",
            {
                size: "32px",
                fill: "#FFF",
                align: "center"
            }
        );
        this.scoreText.anchor.setTo(0.5, 0.5);

        this.input.onDown.add(this.jet, this);

        this.reset();
    },
    update: function(){
        if (this.gameStarted) {
            if (this.player.body.velocity.y > -20) {
                this.player.frame = 3;
            } else {
                this.player.animations.play("fly");
            }

            if(!this.gameOver){
                if(this.player.body.bottom >= this.world.bounds.bottom){
                    this.setGameOver();
                }
                this.physics.arcade.collide(this.player, this.walls, this.setGameOver, null, this);

                this.walls.forEachAlive(function (wall) {
                    if (wall.x + wall.width < game.world.bounds.left) {
                        wall.kill();
                    } else if (!wall.scored && wall.x <= state.player.x) {
                        state.addScore(wall);
                    }
                });
            }
        } else {
            this.player.y = this.world.centerY + (8 * Math.cos(this.time.now/200));
        }
    },
    reset: function(){
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;

        this.background.autoScroll(-SPEED * 0.80 ,0);

        this.walls.removeAll();

        this.player.body.allowGravity = false;
        this.player.reset(this.world.width / 4, this.world.centerY);
        this.player.animations.play('fly');

        this.scoreText.setText("TOUCH TO\nSTART GAME");
    },
    start: function(){
        this.player.body.allowGravity = true;
        this.scoreText.setText("SCORE\n"+this.score);
        this.wallTimer = this.game.time.events.loop(Phaser.Timer.SECOND * SPAWN_RATE, this.spawnWalls, this);
        this.wallTimer.timer.start();
        this.gameStarted = true;
    },
    jet: function(){
        if (!this.gameStarted) {
            this.start();
        }

        if (!this.gameOver) {
            this.player.body.velocity.y = -JET;
            this.jetSnd.play();
        } else if(this.time.now > this.timeOver + 400) {
            this.reset();
        }
    },
    setGameOver: function(){
        this.gameOver = true;
        this.timeOver = this.time.now;

        this.hurtSnd.play();

        this.scoreText.setText("FINAL SCORE\n"+ this.score+"\n\nTOUCH TO\nTRY AGAIN");

        this.player.body.velocity.x = 0;

        this.background.autoScroll(0, 0);

        this.walls.forEachAlive(function (wall) {
            wall.body.velocity.x = wall.body.velocity.y = 0;
        });
        this.wallTimer.timer.stop();
    },
    spawnWall: function(y, flipped) {
        var wall = this.walls.create(
            game.width,
            y + ((flipped ? -OPENING : OPENING) /2),
            'wall'
        );

        this.physics.arcade.enableBody(wall);
        wall.body.allowGravity = false;
        wall.scored = false;
        wall.body.immovable = true;
        wall.body.velocity.x = -SPEED;
        if(flipped){
            wall.scale.y = -1;
            wall.body.offset.y = -wall.body.height;
        }

        return wall;   
    },
    spawnWalls: function() {
        var wallY = this.rnd.integerInRange(game.height * 0.3, game.height * 0.7);
        var botWall = this.spawnWall(wallY);
        var topWall = this.spawnWall(wallY, true);
    },
    addScore: function (wall) {
        wall.scored = true;
        this.score += 0.5;
        this.scoreSnd.play();
        this.scoreText.setText("SCORE\n" + this.score);
    }
};

var game = new Phaser.Game(
    320,
    568,
    Phaser.AUTO,
    'game',
    state
);