const hexRadius = 40;

let hexes = [];
let cars = [];
let numberOfCars = 20;
let customers = [];
let numberOfCustomers = 20;

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function setup() {
    // put setup code here
    createCanvas(1200, 1000);
    background(0);
    hexes = createHexGrid(1200, 1000);

    for (let i = 0; i < numberOfCars; i++) {
        cars.push(new Car(getRandomInt(40, 1150), getRandomInt(40, 950)));
    }

    for (let i = 0; i < numberOfCustomers; i++) {
        customers.push(new Customer(getRandomInt(40, 1150), getRandomInt(40, 950)));
    }

}

function draw() {
    for (let i = 0; i < hexes.length; i++) {
        hexes[i].show();
    }

    for (let i = 0; i < numberOfCustomers; i++) {
        customers[i].findClosestCars();
        customers[i].show();
    }

    for (let i = 0; i < numberOfCars; i++) {
        cars[i].show();
    }

}

function mouseClicked() {
    for (let i = 0; i < cars.length; i++) {
        if (cars[i].pressed()) {
            return;
        }
    }
    for (let i = 0; i < hexes.length; i++) {
        if (hexes[i].pressed()) {
            return;
        }
    }


}

const createHexGrid = (width, height) => {
    const objects = []
    const angle = 2 * PI / 6;
    for (let y = hexRadius; y + hexRadius * Math.sin(angle) < height; y += hexRadius * Math.sin(angle)) {
        for (let x = hexRadius, j = 0; x + hexRadius * (1 + Math.cos(angle)) < width; x += hexRadius * (1 + Math.cos(angle)), y += (-1) ** j++ * hexRadius * Math.sin(angle)) {
            objects.push(new Hexagon(x, y));
        }
    }
    return objects;
    // return objects;
}

class Hexagon {

    constructor(positionX, positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.r = 40;
        this.counter = 0;
    }

    getSettingsFromCounter = () => {
        switch (this.counter) {
            case 0:
                return {
                    color: 'rgba(66,135,63,0.5)', text: 'Małe'
                }
            case 1:
                return {
                    color: 'rgba(255, 255, 0, 0.5)', text: 'Średnie'
                }
            case 2:
                return {
                    color: 'rgba(255, 0, 0, 0.5)', text: 'Duże'
                }

        }
    }

    show() {
        const a = 2 * PI / 6;
        strokeWeight(1);
        stroke(255, 255, 255)
        fill(`${this.getSettingsFromCounter().color}`)
        beginShape()
        for (let i = 0; i <= 6; i++) {
            vertex(this.positionX + this.r * Math.cos(a * i), this.positionY + this.r * Math.sin(a * i));
        }
        endShape();
        textAlign(CENTER, CENTER);
        stroke(0)
        noFill()
        text(this.getSettingsFromCounter().text, this.positionX, this.positionY);
    }

    pressed() {
        if (dist(this.positionX, this.positionY, mouseX, mouseY) < this.r) {
            if (this.counter === 2) {
                this.counter = 0
            } else {
                this.counter++;
            }
            return true;
        }

        return false;
    }

}

class Car {

    constructor(positionX, positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.isReserved = false;
        this.r = 20;
    }


    show() {
        stroke(255, 255, 255)
        strokeWeight(1);
        if (this.isReserved) {
            fill(153, 102, 51)
        } else {
            fill(0)
        }
        circle(this.positionX, this.positionY, this.r)
        stroke(0);
        noFill();
        text(cars.indexOf(this), this.positionX, this.positionY);
    }

    pressed() {
        if (dist(this.positionX, this.positionY, mouseX, mouseY) < this.r) {
            this.isReserved = !this.isReserved;
            return true;
        }

        return false;
    }


}

class Customer {

    constructor(positionX, positionY) {
        this.positionX = positionX;
        this.positionY = positionY;
        this.size = 20;
        // this.isAssigned = false;
        this.assignedCarIndex = undefined;
    }

    show() {
        stroke(255, 255, 255)
        strokeWeight(1);
        fill(0, 51, 204)
        rect(this.positionX, this.positionY, this.size, this.size);
        textAlign(CENTER, CENTER);
        stroke(0);
        noFill();
        text(customers.indexOf(this), this.positionX + this.size / 2, this.positionY + this.size / 2);
    }

    findClosestCars() {
        if (!this.assignedCarIndex) {
            let minDistance = Number.MAX_SAFE_INTEGER;
            let indexToCollect = 0;
            for (let i = 0; i < numberOfCars; i++) {
                const distance = dist(this.positionX, this.positionY, cars[i].positionX, cars[i].positionY)
                if (distance < minDistance && !cars[i].isReserved) {
                    minDistance = distance;
                    indexToCollect = i;
                }
            }

            // strokeWeight(10);
            this.assignedCarIndex = indexToCollect;
            cars[indexToCollect].isReserved = true;
            console.log("Index to collect: " + indexToCollect)

        }
        stroke(212, 121, 121)
        strokeWeight(5);
        line(this.positionX + this.size / 2, this.positionY + this.size / 2, cars[this.assignedCarIndex].positionX, cars[this.assignedCarIndex].positionY);
    }
}