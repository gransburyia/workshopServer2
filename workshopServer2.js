let express = require("express");
let bodyParser = require("body-parser");
const app = express();

app.set("port", 8080);
app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.urlencoded({ extended: true }));

var Pool = require("pg").Pool;
var config = {
	host: "localhost",
	user: "server2",
	password: "server2",
	database: "workshopserver2"
};

var pool = new Pool(config);

var dateFormat = require('dateformat');

app.get("/hello", async (req, res) => {
	res.json("Hello World");
});

//api number 1

app.post("/create-user", async (req, res) => {
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;
	const username = req.body.username;
	const email = req.body.email;
  if(firstname == undefined || lastname == undefined || username == undefined || email == undefined)
	{
    res.json({error: 'parameters not given'});
  }
  else
  {
			const template = "SELECT * FROM attendees WHERE username=$1";
			const response = await pool.query(template, [username]);
			if(response.rowCount > 0){
					res.json({"status": "username taken"});
				}
				else
				{
  				const template = "INSERT INTO attendees (firstname, lastname, username, email) VALUES ($1, $2, $3, $4)";
					const response = await pool.query(template, [
						firstname,
						lastname,
						username,
						email
					]);
  				res.json({"status" : "user added"});
  	 		}
			}

});

//api number 2
app.delete("/delete-user", async (req, res) => {
	const username = req.body.username;
	try{
		if (username == undefined){
			res.json({error: 'parameters not given'});
		}
		else{
			const template1 = "DELETE FROM together where username = $1";
			const response1 = await pool.query(template1, [username]);
			const template2 = "DELETE FROM attendees where username = $1";
			const response2 = await pool.query(template2, [username]);

			res.json({"status": "deleted"});
		}
		}
		catch(err)
		{
			res.json("error");
		}

});

//api number 3
app.get("/list-users", async (req, res) => {
	const type = req.query.type;
	try{
		const template = "SELECT * FROM attendees";
		const response = await pool.query(template);
		if(type == 'full'){
			const template = "SELECT * FROM attendees";
			const response = await pool.query(template);
			res.json({"users": response.rows});
			}
		else if (type == 'summary'){
			const template = "SELECT firstname, lastname FROM attendees";
			const response = await pool.query(template);
			res.json({"users": response.rows});
			}
		else {
				res.json("error not correct type");
			}
		}
		catch(err)
		{
			res.json("error");
		}
});

//api number 4
app.post("/add-workshop", async (req, res) => {
	const title = req.body.title;
	const date = req.body.date;
	const location = req.body.location;
	const maxseats = req.body.maxseats;
	const instructor = req.body.instructor;
try{
  if(title == undefined || date == undefined || location == undefined || maxseats == undefined || instructor == undefined)
	{
    res.json({error: 'parameters not given'});
  }
  else
  {
			const template = "SELECT * FROM workshops WHERE title=$1 and date=$2 and location =$3";
			const response = await pool.query(template, [
				title,
				date,
				location]);
			if(response.rowCount > 0){
					res.json({"status": "worskhop already in database"});
				}
				else
				{
  				const template = "INSERT INTO workshops (title, date, location, maxseats, instructor) VALUES ($1, $2, $3, $4, $5)";
					const response = await pool.query(template, [
						title,
						date,
						location,
						maxseats,
						instructor]);
  				res.json({"status" : "workshop added"});
  	 		}
			}
		}
		catch(err)
		{
			res.json("error");
		}
});

//api number 5
app.post("/enroll", async (req, res) => {
	const title = req.body.title;
	const date = req.body.date;

	const location = req.body.location;
	const maxseats = req.body.maxseats;
	const instructor = req.body.instructor;
	const username = req.body.username;
	//checking if username not already in database
	const template1 = "SELECT * FROM attendees where username = $1";
	const response1 = await pool.query(template1, [username]);
	//checking if workshop not already in database
	const template2 = "SELECT * FROM workshops where title = $1 and date = $2 and location = $3";
	const response2 = await pool.query(template2, [
		title,
		date,
		location
	]);
	//checking if username is already enrolled in course
	const template3 = "SELECT attendees.username FROM attendees JOIN together ON attendees.username = together.username JOIN workshops ON together.id = workshops.id WHERE workshops.title = $1 AND workshops.date = $2 and workshops.location = $3";
	const response3 = await pool.query(template3, [
		title,
		date,
		location
	]);
	let numEnrolled = 0;
	let enrolled = false;
	for(let i=0; i< response3.rowCount; i++){
		numEnrolled++;
		if(response3.rows[i].username == username)
		{
			enrolled = true;
		}
	}

	if(response1.rowCount == 0){
		console.log("statement 1, not in database");
		res.json({"status": "user not in database"});
	}
	else if(response2.rowCount == 0){
		console.log("statement 2, does not exist");
		res.json({"status": "workshop does not exist"});
	}
	else if(enrolled == true){
		console.log("statement 3, user already enrolled");
		res.json({"status": "user already enrolled"});
	}
	else if(numEnrolled == maxseats){
		console.log("statement 4, no seats");
		res.json({"status": "no seats available"});
	}
	else{
		console.log("statement 5, enrolled");
		const template6 = "SELECT id FROM workshops WHERE workshops.title = $1 AND workshops.date = $2 and workshops.location = $3";
		const id = await pool.query(template6, [
			title,
			date,
			location
		]);
		const template = "INSERT INTO together (id, username) VALUES ($1, $2)";
		const response4 = await pool.query(template, [
			id.rows[0].id,
			username
		]);
		res.json({"status": "user added"});
	}
});

//api number 6
app.get("/list-workshops", async (req, res) => {
	const template = "SELECT title, date, location FROM workshops";
	const response = await pool.query(template);
	for (let i=0; i< response.rowCount; i++){
		response.rows[i].date = dateFormat(response.rows[i].date, "yyyy-mm-dd");
	}
	res.json({"workshops": response.rows});
});

//api number 7
app.get("/attendees", async (req, res) => {
	const title = req.query.title;
	const date = req.query.date;
	const location = req.query.location;
	const template = "SELECT attendees.firstname, attendees.lastname FROM attendees JOIN together ON attendees.username = together.username JOIN workshops ON together.id = workshops.id WHERE workshops.title = $1 AND workshops.date = $2 and workshops.location = $3";
	const response = await pool.query(template, [
			title,
			date,
			location]);
	const template2 = "SELECT * FROM workshops where title = $1 and date = $2 and location = $3";
	const response2 = await pool.query(template2, [
				title,
				date,
				location
			]);
	if (response2.rowCount == 0){
		res.json({"error" : "workshop does not exist"});
	}

	else{
			res.json({"attendees": response.rows});
		}

});

app.listen(app.get("port"), () => {
	console.log(`Find the server at http://localhost:${app.get("port")}`);
});
