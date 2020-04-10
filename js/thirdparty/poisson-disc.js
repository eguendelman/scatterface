/**
 * A Poisson Disc Sampling routine - randomly but evenly place dots on the screen..
 *
 * @property {Number} width - Width of the display in pixels
 * @property {Number} height - Height of the display in pixels
 * @property {Number} r - The minimum distance between points
 * @property {Number} k - Number of tries to make a new point before giving up
 * @property {Number} n - n-dimensional grid
 * @property {Number} cellSize - The size of the grid cell = r / sqrt(n)
 * @property {Number} cols - Number of columns in the grid
 * @property {Number} rows - Number of rows in the grid
 * @property {Object[]} points - Array of points already plotted
 * @property {Number[]} active - Array of active points indices
 * @property {Number[]} grid - Grid array of point indices
 * @author Matthew Page <work@mjp.co>
 */
class PoissonDisc {
	/**
	 * Create a new disc sampler
	 *
	 * @param {Number} w - Width of the display in pixels
	 * @param {Number} h - Height of the display in pixels
	 * @param {Number} r - The minimum distance between points
	 * @param {Number} k - Number of tries to make a new point before giving up
	 * @param {Number} n - n-dimensional grid
	 */	
	constructor(w, h, r, k, n) {	
		this.width = w;
		this.height = h;
		this.r = r;
		this.k = k;
		this.n = n;
		this.cellSize = Math.floor(this.r / Math.sqrt(this.n));
		this.cols = Math.floor(this.width / this.cellSize);
		this.rows = Math.floor(this.height / this.cellSize);
		this.points = [];
		this.active = [];
		this.grid = [];
		this.reset();
	}
	/**
	 * Reset the algorithm and data
	 */
	reset() {
		this.points = [];
		this.active = [];
		this.grid = [];	
		this.initialiseGrid();
		this.addPoint(this.getRandom(0, this.width), this.getRandom(0, this.height));		
	}
	/**
	 * Run the algorithm till the end
	 */
	run() {
		this.reset();
		while(this.active.length > 0) {
			this.step(1);
		}
	}
	/**
	 * Take a single or n steps through the algorithm
	 */
	step(n) {
		
		/* Take one or 'n' steps */
		for(let l=0; l<n; l+=1) {
	
			/* While there are still active points */
			if(this.active.length > 0) {

				/* Get a random point from the Active list */
				let randomActive = this.getRandom(0, this.active.length);
				let currentPoint = this.points[this.active[randomActive]];

				/* Track if we manage to find a new point from this one */
				let foundNewPoint = false;

				/* Generate up to k points randomly between r and 2r */
				for(let tries = 0; tries < this.k; tries+=1) {

					/* Is the new point valid, start assuming it is */
					let pointValid = true;

					/* Uniformly distribute the angle or random, not clear in the docs */
					/* let newAngle = Math.floor(Math.random()*(Math.PI*2)); */
					let newAngle = tries*((Math.PI*2)/this.k);
					
					/* Get a random distance r to 2r */
					let newDist = this.getRandom(this.r, this.r*2);

					/* Calculate the new position */
					let offsetX = Math.cos(newAngle)*newDist;
					let offsetY = Math.sin(newAngle)*newDist;
					let newX = Math.floor(currentPoint.px + offsetX);
					let newY = Math.floor(currentPoint.py + offsetY);
					let newGridX = Math.floor(newX / this.cellSize);
					let newGridY = Math.floor(newY / this.cellSize);

					if( ( newX > 0 ) && ( newX < this.width ) && ( newY > 0 ) && ( newY < this.height ) ) {
						
						/* It is inside the screen area */
						
						if(this.grid[newGridY][newGridX] < 0) {
							
							/* There is not a point at this grid reference - get the neighbours */
							
							for(let i=-1; i<=1; i++) {
								
								for(let j=-1; j<=1; j++) {
									
									/* Each neighbour grid location */
									
									let neighbourGridX = newGridX+j;
									let neighbourGridY = newGridY+i;

									if( ( neighbourGridX >= 0 ) && ( neighbourGridY >= 0 ) 
										&& ( neighbourGridX < this.cols ) && ( neighbourGridY < this.rows ) 
										&& (( neighbourGridX !== newGridX ) || ( neighbourGridY !== newGridY )) ) {

										/* Neighbour is within the grid and not the centre point */
										
										if(this.grid[neighbourGridY][neighbourGridX] >= 0) {

											/* It has a point in it - check how far away it is */
											
											let neighbourIndex = this.grid[neighbourGridY][neighbourGridX];
											let neighbour = this.points[neighbourIndex];
											let dist = Math.sqrt( ((newX - neighbour.px)*(newX - neighbour.px)) +
																  ((newY - neighbour.py)*(newY - neighbour.py)) );
											
											/* Invalid, to close to a neighbour point */
											if(dist < this.r) pointValid = false;
										}
									}
								}
							} 
						} else {
							/* Invalid, there is already a point in this cell */
							pointValid = false;
						}
					} else {
						/* Invalid, point is outside the grid */
						pointValid = false;
					}
					if(pointValid) {
						/* Valid, add this point */
						foundNewPoint = true;
						this.addPoint(newX, newY);
					} 
				} // For tries...
				
				if(!foundNewPoint) {
					
					/* Didn't find a new point after k tries - remove this point from Active list */
					this.active.splice(randomActive, 1);
				}
			}
		} // n loop
	}
	/**
	 * Add a new point to the points, grid and active arrays. Points array holds the
	 * point data and grid / active hold indices to the points array.
	 *
	 * @param {Number} x - The pixel X position of the point
	 * @param {Number} y - The pixel Y position of the point
	 */
	addPoint(x, y) {
		let point = { 
			px: parseInt(x),
			py: parseInt(y),
			gx: Math.floor(parseInt(x) / this.cellSize),
			gy: Math.floor(parseInt(y) / this.cellSize),
		};
		let pointIndex = this.points.length;
		this.points.push(point);		
		this.grid[point.gy][point.gx] = pointIndex;
		this.active.push(pointIndex);
	}
	/**
	 * Initialise the empty background grid array 
	 */
	initialiseGrid() {
		for(let y = 0; y <= this.rows; y+=1) {
			this.grid[y] = [];
			for(let x = 0; x <= this.cols; x+=1) {
				this.grid[y][x] = -1;
			}
		}
	}
	/**
	 * Get a random integar between min and max
	 *
	 * @param {Number} min - The minimum value
	 * @param {Number} max - The maximum value
	 * @returns {Number} Random number from min to max
	 */
	getRandom(min, max) {
		return Math.floor(Math.random()*(max-min))+min;
	}
}