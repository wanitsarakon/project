export default class CharacterManager{

constructor(scene){

this.scene = scene

this.player = scene.add.sprite(
300,
scene.scale.height/2,
"kid"
)

this.enemy = scene.add.sprite(
scene.scale.width-300,
scene.scale.height/2,
"man"
)

}

playerPull(){

this.player.setTexture("kid_pull")

}

enemyPull(){

this.enemy.setTexture("man_pull")

}

}