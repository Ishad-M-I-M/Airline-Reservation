const bcrypt = require('bcrypt');

class Router {

    constructor(app, db) {
        this.login(app, db);
        this.logout(app, db);
        this.isLoggedIn(app, db);
        this.fetchFlightRoute(app, db);
        this.fetchAircraft(app, db);
        this.addFlight(app, db);
        this.getAirportCode(app, db);
        this.fetchClerkFlightDetails(app, db);
        this.fetchBookFlightDetails(app, db);
    }

    login(app , db) {
        app.post('/login', (req, res) => {
            // console.log("Request to login");
            let email = req.body.email;
            let password = req.body.password;

            email = email.toLowerCase().trim();

            if(email.length > 50 || password.length > 50){
                res.json({
                    success: false,
                    msg: 'Not an authorized request'
                });
                return;
            }

            let cols = [email];
            db.query("SELECT * FROM user WHERE email = ? LIMIT 1", cols, (err, data, fields) => {

                if(err) {
                    res.json({
                        success: false,
                        msg: "Error occured while querying the data",
                    })
                    return;
                }

                //Found a user
                if(data && data.length === 1) {
                    bcrypt.compare(password, data[0].password, (bcryptErr, verified)=>{
                        if(verified) {
                            req.session.userID = data[0].user_id;
                            res.json({
                                success:true,
                                email: data[0].email,
                                role: data[0].role
                            })
                            // console.log(`Successfully sending back ${data[0].email}`);
                            return;
                        }else {
                            res.json({
                                success:false,
                                msg : "Invalid password",
                            })
                        }
                    })
                } else {
                    res.json({
                        success:false,
                        msg: "User not found"
                    })
                }
            });
        });
    }

    logout(app, db) {

        app.post('/logout', (req, res)=>{

            if(req.session.userID) {

                req.session.destroy();
                res.json({
                    success:true,

                })

                return true;
            } else {
                res.json({
                    success: false,
                })

                return false;
            }
        })
    }

    isLoggedIn(app, db) {

        app.post('/isLoggedIn', (req, res)=>{
            if(req.session.userID) {
                let cols = [req.session.userID];
                db.query('SELECT * FROM user WHERE user_id = ? LIMIT 1', cols, (err, data, fields) => {
                    if(data && data.length === 1) {
                        res.json({
                            success: true,
                            email: data[0].email,
                            role: data[0].role,
                        });

                        return true;
                    }else  {
                        res.json({
                            success: false,
                        });
                    }
                });
            }else {
                res.json({
                    success: false
                })
            }
        });
    }

    fetchFlightRoute(app, db) {

        app.post('/flightroute', (req, res) => {
            if(req.session.userID) {
                db.query('SELECT route_id, a1.code AS origin, a2.code AS destination FROM route LEFT JOIN airport a1 ON route.origin = a1.airport_id LEFT JOIN airport a2 ON route.destination=a2.airport_id',(err, data, fields) => {
                    res.json({
                        success: true,
                        details: data,
                    });
                })
            }else {
                res.json({
                    success: false,
                    msg: 'Login to the system'
                });
            }
        });

    }

    fetchAircraft(app, db) {
        app.post('/aircraft', (req, res) => {
            if(req.session.userID) {
                db.query('SELECT aircraft_id, model from aircraft', (err, data, fields)=>{
                    res.json({
                        success: true,
                        details: data,
                    });
                });
            }else {
                res.json({
                    success: false,
                    msg: 'Login to the system'
                });
            }
        });
    }

    addFlight(app, db) {
        app.post('/addFlight', (req, res) => {
            if(req.session.userID) {
                let aircraft_id = req.body.aircraft_id;
                let route_id = req.body.route_id;
                let takeoff_time = req.body.takeoff_time;
                let landing_time = req.body.landing_time;
                db.query('INSERT INTO flight (aircraft_id, route_id, takeoff_time, departure_time) VALUES (?, ?, ?, ?)',[aircraft_id, route_id, takeoff_time, landing_time],(err, fields)=>{
                    if(err) {
                        res.json({
                            success:false,
                            msg:'Insertion Failed, Try again',
                        });
                    }else {
                        res.json({
                            success: true,
                            msg:'Insertion Success'
                        });
                    }
                });
            }else {
                res.json({
                    success:false,
                    msg:'Login to the System'
                });
            }
        })
    }

    getAirportCode(app, db) {
        app.post('/airportCodes',(req, res)=>{
            if(req.session.userID) {
                db.query('SELECT code from airport', (err, data, fields)=>{
                    if(err) {
                        res.json({
                            success: false,
                        });
                    }else {
                        res.json({
                            success: true,
                            codes : data
                        });
                    }
                })
            } else {
                res.json({
                    success: false,
                });
            }
        })
    }

    fetchClerkFlightDetails(app, db) {
        app.post('/fetchFlight/clerk', (req, res)=>{
            if(req.session.userID) {
                console.log(req.body);
            }else {
                res.json({
                    success:false,
                })
            }
        })
    }

    fetchBookFlightDetails(app, db) {
        app.post('/bookingFlights',(req, res) => {
            if(req.session.userID) {
                db.query('select flight_id, takeoff_time, departure_time, model, total_seats, Economy_seats, Business_seats, Platinum_seats, airport1.code as origin, airport2.code as destination from flight inner join aircraft using(aircraft_id) inner join route using (route_id) inner join airport as airport1 on airport1.airport_id=route.origin inner join airport as airport2 on airport2.airport_id=route.destination where takeoff_time > now() order by takeoff_time', (err, data, fields)=>{
                    if(err) {
                        res.json({
                            success:false,
                        });
                    }else {
                        res.json({
                            success:true,
                            data: data,
                        });
                    }
                });
            }else {
                req.json({
                    success:false,
                });
            }
        });
    }
}

module.exports = Router;