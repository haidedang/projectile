const fs = require('fs');
let request = require("request");

let user = JSON.parse(fs.readFileSync('user.txt'));

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
                        login: user.login,
                        password: user.password },
                strictSSL: false //TODO: SSL Zertifizierung mit node.js
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);

               //  console.log(response.headers['set-cookie']);
                let temp = response.headers['set-cookie'][0];
                let cookie = temp.split(';')[0];

                resolve(cookie);
            });
        }
    )
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

            resolve(advJoblist);
        });

    })

}


function normalPostURL(method, url, cookie, body){
    return new Promise((resolve,reject)=> {
        let options = option( method, url, cookie, body);

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            // console.log(body);
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


async function saveEntry(cookie, employee, number, time, project, note){
    console.log(employee)

    // let temp = await  normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie,{"Dock":["Area.TrackingArea"],[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"]})
    let dayList = await getDayListToday(cookie,employee);
    let listEntry =   dayList[number];
/*    // Timetracker page
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515597712965', cookie, {[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"],"Dock":["Area.TrackingArea","Area.ProjectManagementArea"]} );
    // setToday
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515501823869', cookie, {"values":{[employee]:[{"n":"Begin","v":new Date()}]}})*/
    //time
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080248606', cookie,  {"values":{[listEntry]:[{"n":"Time","v": time }]}} );
    // select Project
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080624305', cookie, {"values":{[listEntry]:[{"n":"What","v": project}]}});
    // write note
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515080659058', cookie,  {"values":{[listEntry]:[{"n":"Note","v": note}]}});
    // save entry
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515080819797', cookie,  {"ref":employee,"name":"*","action":"Save","Params":{}})
    // refresh
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=options&_dc=1515596886820', cookie,  {[employee]:["FilterCustomer","FilterProject"]});

}

async function deleteEntry(cookie, employee, number){
    let dayList = await getDayListToday(cookie,employee);
    let listEntry =   dayList[number];
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515678755483', cookie,  {"ref":employee,"name":"DayList","action":"RowAction_Delete","Params":{"ref":listEntry}} );
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515679735908', cookie, {"ref":"1515679733964-0","name":"*","action":"+0+1__null_","Params":{"isDialog":true}});
    /*// save entry
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=action&_dc=1515080819797', cookie,  {"ref":employee,"name":"*","action":"Save","Params":{}});*/
    // refresh
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=options&_dc=1515596886820', cookie,  {[employee]:["FilterCustomer","FilterProject"]});
}

async function getDayListToday(cookie, employee){
    let temp = await  normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie,{"Dock":["Area.TrackingArea"],[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"]})
    let dayList = await temp["values"][employee][2]["v"];
    return dayList;
}

async function setCalendarDateToday(cookie, employee){
    // Timetracker page
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515597712965', cookie, {[employee]:["DayList","JobList","Begin","Favorites","TrackingRestriction","FilterCustomer","FilterProject"],"Dock":["Area.TrackingArea","Area.ProjectManagementArea"]} );
    // setToday
    await normalPostURL('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=commit&_dc=1515501823869', cookie, {"values":{[employee]:[{"n":"Begin","v":new Date()}]}})
}


async function Save(listEntry, time, project, note){
    let cookie =  await login();
    let employee = await getEmployee(cookie);
    await setCalendarDateToday(cookie,employee);
    await saveEntry (cookie, employee, listEntry, time, project, note);
    await console.log('Finish');
}

async function Delete(listEntry){
    let cookie = await login();
    let employee = await getEmployee(cookie);
    await setCalendarDateToday(cookie, employee);
    await deleteEntry(cookie, employee, listEntry);
    console.log("Finished Deleting.")
}


let jobList = async () => {
    let cookie = await login();
    let employee = await getEmployee (cookie);

    return showJobList('POST', 'https://projectile.office.sevenval.de/projectile/gui5ajax?action=get&_dc=1515081239766', cookie, { [employee]:
        [ 'DayList',
            'JobList',
            'Begin',
            'Favorites',
            'TrackingRestriction',
            'FilterCustomer',
            'FilterProject' ],
        Dock: [ 'Area.TrackingArea', 'Area.ProjectManagementArea' ] } , employee).then((data)=> {return data;});

};

function main(){

  /*  await saveEntry(cookie, employee, 0, 6, "2759-328", "Test 1");
    await saveEntry(cookie, employee, 1, 6, "2759-328", "Test 2");
    await saveEntry(cookie, employee, 2, 6, "2759-328", "Test 3");
    /!*  await deleteEntry(cookie, employee, 1); // TODO: delete Entry not working yet.*!/

    //await Save(1,7,"2759-328", "Test3");*/

    function command(){
        console.log("(1) show JobList \n" + "(2) book working Time\n" + "(3) Exit");
        console.log("Enter Number:");

    }

    command();

    process.stdin.on('readable',  () => {
        const chunk = process.stdin.read();

        if (chunk == 1){
                jobList().then((data) => {
                    console.log(data);
                    command();
                });
        } else if(chunk ==2) {
            console.log('Enter: {listEntry} {time} {project-nr.} {note}\n' + 'example: 0 6 2759-327 "Automatisierung Projectile" ');
        } else if (chunk == 3){
            process.exit();
        } else if (chunk !== null){
            let result = chunk.toString().split(' ');
            let temp = result.slice(3)
            let newArr = temp.join().replace(/[,]/g, " ").replace(/["]/g, "");
            // check for errors
            if (result.length < 4){
                throw new Error("invalid parameter");
            } else {
                Save(result[0], result[1], result[2], newArr).then(()=> command());
            }

            /*process.stdout.write('Saved! ');*/
        }

    });

}

main();


