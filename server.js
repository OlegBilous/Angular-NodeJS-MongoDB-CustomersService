const express       = require('express'),
    exphbs          = require('express-handlebars'),
    hbsHelpers      = require('handlebars-helpers'),
    hbsLayouts      = require('handlebars-layouts'),
    cookieParser    = require('cookie-parser'),
    bodyParser      = require('body-parser'),
    session         = require('express-session'),
    errorhandler    = require('errorhandler'),
    csrf            = require('csurf'),
    router          = require('./routes/router'),
    database        = require('./lib/database'),
    seeder          = require('./lib/dbSeeder'),
    app             = express(),
    port            = 3000;

class Server {

    constructor() {
        this.initViewEngine();
        this.initExpressMiddleWare();
        this.initCustomMiddleware();
        this.initDbSeeder();
        this.initRoutes();
        this.start();
    }

    start() {
        app.listen(port, (err) => {
            console.log('[%s] Listening on http://localhost:%d', process.env.NODE_ENV, port);
        });
    }

    initViewEngine() {
        const hbs = exphbs.create({
            extname: '.hbs',
            defaultLayout: 'master'
        });
        app.engine('hbs', hbs.engine);
        app.set('view engine', 'hbs');
        hbsLayouts.register(hbs.handlebars, {});
    }

    initExpressMiddleWare() {
        app.use(cookieParser());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(bodyParser.json());
        app.use(session({ 
            secret: 'customermanagerdemo', 
            saveUninitialized: true,
            resave: true })
        );
        app.use(express.static(__dirname + '/public'));
        app.use(errorhandler());
        app.use(csrf());

        app.use(function (req, res, next) {
            res.locals._csrf = req.csrfToken();
            next();
        });

        process.on('uncaughtException', function (err) {
            if (err) console.log(err, err.stack);
        });
    }

    initCustomMiddleware() {
        if (process.platform === "win32") {
            require("readline").createInterface({
                input: process.stdin,
                output: process.stdout
            }).on("SIGINT", function () {
                console.log('SIGINT: Closing MongoDB connection');
                database.close();
            });
        }

        process.on('SIGINT', function() {
            console.log('SIGINT: Closing MongoDB connection');
            database.close();
        });
    }

    initDbSeeder() {
        database.open(function() {
            //Set NODE_ENV to 'development' and uncomment the following if to only run
            //the seeder when in dev mode
            //if (process.env.NODE_ENV === 'development') {
            //  seeder.init();
            //} 
            seeder.init();
        });
    }

    initRoutes() {
        router.load(app, './controllers');

        // redirect all others to the index (HTML5 history)
        app.all('/*', function(req, res) {
            res.sendFile(__dirname + '/public/index.html');
        });
    }

}

var server = new Server();