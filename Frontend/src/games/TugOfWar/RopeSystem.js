export default class RopeSystem{

constructor(scene){

this.scene = scene

this.rope = scene.add.image(
scene.scale.width/2,
scene.scale.height/2,
"rope"
)

}

moveLeft(){

this.rope.x -= 10

}

moveRight(){

this.rope.x += 10

}

getX(){

return this.rope.x

}

}