
let request = require("request");

/**
 *
 * @returns {Promise} cookie
 */
function login(){

    return new Promise (( resolve, reject) => {
            let options = { method: 'POST',
                url: 'https://projectile.office.sevenval.de/projectile/start',
                headers:
                    {'content-type': 'application/x-www-form-urlencoded' },
                form:
                    { action: 'login2',
                        clientId: '0',
                        jsenabled: '1',
                        isAjax: '0',
                        develop: '0',
                        login: 'haiduc.dang',
                        password: 'He0MeuNT' },
                strictSSL: false //TODO: SSL Zertifizierung mit node.js
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

               //  console.log(response.headers['set-cookie']);
                let temp = response.headers['set-cookie'][0];
                let cookie = temp.split(';')[0];

                resolve(cookie);

                // getURL('GET', 'https://projectile.office.sevenval.de/projectile/start#%21/Intro', cookie); d

            });
        }
    )
}

/**
 *
 * @returns {Promise.<void>}
 */

/*async function getHomePage(){
    let cookie = await login();
    let employee = await getEmployee(cookie);

    let bod = {};
    bod[employee] = [ 'DayList',
        'JobList',
        'Begin',
        'Favorites',
        'TrackingRestriction',
        'FilterCustomer',
        'FilterProject' ];

    bod["Dock"]=  [ 'Area.TrackingArea', 'Area.ProjectManagementArea' ];


    await showJobList('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie, (function(){return bod})() , employee);
    // console.log(item);

    // TODO: synchronous design
    // change calendar date to today
    await setEntryToday(cookie, employee);
    // //   getDayListToday(cookie, item);
    //
    // //view ListEntry for today
    await  PostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie,{"Dock":["Area.TrackingArea"],"TimeTracker!^.|Default|Employee|1|475":["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"]}, function(result){
        console.log(result["values"][employee][2]["v"]);
    } );

}*/

let jobList = async () => {
    let cookie = await login();
    let employee = await getEmployee (cookie);



    showJobList('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie, { [employee]:
        [ 'DayList',
            'JobList',
            'Begin',
            'Favorites',
            'TrackingRestriction',
            'FilterCustomer',
            'FilterProject' ],
        Dock: [ 'Area.TrackingArea', 'Area.ProjectManagementArea' ] } , employee);
};

jobList(); //


async function bookTime (time, note, project, listentry){
    let cookie = await login();
    let employee = await getEmployee(cookie);

    // change CalendarDate to todays date
    await setEntryToday(cookie, employee);
    let temp = await  PostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie,{"Dock":["Area.TrackingArea"],[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"]})
    let dayList = temp["values"][employee][2]["v"];
    await console.log(dayList);

    // time
   await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080248606', cookie,  {"values":{[dayList[listentry]]:[{"n":"Time","v":time}]}} );
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=options&_dc=1515080619255', cookie, {[dayList[listentry]]:["What"]}        );

    // Auswahl des Projektes
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080624305', cookie, {"values":{[dayList[listentry]]:[{"n":"What","v":project}]}});

    // Bemerkung
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080659058', cookie,  {"values":{[dayList[listentry]]:[{"n":"Note","v":note}]}});

    // Speichern
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515080819797', cookie,  {"ref":[employee],"name":"*","action":"Save","Params":{}})

    console.log("SUCCESS");

}



// bookTime(1, "test", "2759-327", 4);





/**
 *
 * @param string
 * @param url
 * @param cookie
 * returns the body of an HTTP post Request
 */
function getURL(string , url, cookie){
    var options = { method: string,
        url: url,
        headers:
            {
                cookie: cookie },
        strictSSL: false};

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
         console.log(body);
    });
}

function option (method, url, cookie, body){
    var options = { method: method,
        url: url ,
        headers:
            {
                cookie: cookie,
                'content-type': 'application/json' },
        body: body,
        json: true,
        strictSSL: false
    };
    return options;
}

function showJobList(method, url, cookie, body, Employee){
    return new Promise((resolve, reject)=>{
        let options = option(method, url, cookie, body);

        request(options, function (error, response, body) {
            if (error) throw new Error(error);


            /**
             * get name and NO. of Employee Job
             */
            let temp  = body["values"][Employee][11]["v"];
            let joblist = [];


            for(var i=0; i<temp.length; i++){
                joblist.push(temp[i]);
            }

            let advJoblist = [];


            for(var i= 0; i<joblist.length; i++){
                let obj = {};
                obj.name = body["values"][joblist[i]][32]["v"]; //TODO: function to retrieve index of jobname and joblink
                obj.no = body["values"][joblist[i]][11]["v"];
                advJoblist.push(obj);
            }

            console.log(advJoblist);
            resolve();
        });

    })

}


function normalPostURL(method, url, cookie, body){
    return new Promise((resolve,reject)=> {
        let options = option( method, url, cookie, body);

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            // console.log(body);
            resolve();

        });

    })

}

function PostURL(method, url, cookie, body){
    return new Promise((resolve,reject)=>{
        let options = option( method, url, cookie, body);

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            resolve(body);

        });

    })

}

/**
 *
 * @param cookie
 * @returns {Promise} Employee
 */
function getEmployee(cookie){
    return new Promise((resolve) => {
        let options=  option ('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515496876799', cookie, {"ref":"Start","name":"*","action":"TimeTracker1","Params":{}} );
        request(options, function(error, response, body){
            if (error) throw new Error(error);
            let EmplN = JSON.parse(body["values"]["Dock"][0]["v"][0])["a"];
            let tem = EmplN.substr(1);
            resolve(tem);
            // console.log(JSON.parse(body["values"]["Dock"][0]["v"][0])["a"]);
        })
    })
}



function getDayListToday( cookie, employee){

    PostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie, (() => {
        let obj = {};
        obj["Dock"] = ["Area.TrackingArea"];
        obj[employee]= ["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"];
        return obj;
    })(), (result) => {
        console.log(result["values"][employee][2]["v"]);
    });

}

async function saveEntry(cookie, employee){

    // Timetracker page
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515597712965', cookie, {[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"],"Dock":["Area.TrackingArea","Area.ProjectManagementArea"]} );
    // setToday
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515501823869', cookie, {"values":{[employee]:[{"n":"Begin","v":new Date()}]}})
    //time
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080248606', cookie,  {"values":{"+.|DayList|0|TimeTracker!^.|Default|Employee|1|475":[{"n":"Time","v":6 }]}} );
    // select Project
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080624305', cookie, {"values":{"+.|DayList|0|TimeTracker!^.|Default|Employee|1|475":[{"n":"What","v":"2759-327"}]}});
    // write note
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080659058', cookie,  {"values":{"+.|DayList|0|TimeTracker!^.|Default|Employee|1|475":[{"n":"Note","v":"Automatisierung Projectile mit Node.jefdfds"}]}});
    // save entry
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515080819797', cookie,  {"ref":"TimeTracker!^.|Default|Employee|1|475","name":"*","action":"Save","Params":{}})
    // refresh
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=options&_dc=1515596886820', cookie,  {"TimeTracker!^.|Default|Employee|1|475":["FilterCustomer","FilterProject"]});

}

async function Save(){
    let cookie =  await login();
    let employee = await getEmployee(cookie);

    await saveEntry (cookie, employee);
    await console.log('Finish');
}

Save();


async function setEntryToday(cookie, Employee){

    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515501823869', cookie, {"values":{[Employee]:[{"n":"Begin","v":"2018-01-10T00:00:00"}]}});

    // await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515501823869', cookie, (function(){
    //     let obj ={"gui_TimeTracker_JobList":{"columns":[{"di":"gridcolumn-1287"},{"di":"rownumberer-1288","width":23},{"di":"_actions","width":46},{"di":"ProcessNumberWithLink"},{"di":"JobNameWithLink"},{"di":"ProjectNameWithLink"},{"di":"Customer"},{"di":"DueTime"},{"di":"Time"},{"di":"TotalTime"},{"di":"TimeToCompletion"},{"di":"Favorite","width":30}],"filters":{}}}
    //     return obj;
    // })());


    // normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=state&_dc=1515501825072', cookie, {"gui_TimeTracker_JobList":{"columns":[{"di":"gridcolumn-1287"},{"di":"rownumberer-1288","width":23},{"di":"_actions","width":46},{"di":"ProcessNumberWithLink"},{"di":"JobNameWithLink"},{"di":"ProjectNameWithLink"},{"di":"Customer"},{"di":"DueTime"},{"di":"Time"},{"di":"TotalTime"},{"di":"TimeToCompletion"},{"di":"Favorite","width":30}],"filters":{}}});


}

