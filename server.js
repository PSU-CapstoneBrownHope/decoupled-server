const express = require('express');
const airtable = require('airtable');
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.BASE_ID;
const base = new airtable({apiKey: airtableApiKey}).base(baseId);

//This is fake airtable data
const applicationsBank = [
  {
    appid: '12',
    user: 'fakeuser1',
    applicationStatus: 'Pending'
  },
  {
    appid: '13',
    user: 'fakeuser2',
    applicationStatus: 'Denied'
  },
  { 
    appid: '14',
    user: 'fakeuser3',
    applicationStatus: 'Approved'
  }

]
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})

app.get('/', (req, res, next) => {
  res.sendStatus(200)
})

app.post('/get-application-status', (req, res, next) => {
  console.log(req.body);
  let appstatus = 0;
  applicationsBank.forEach(user => {
    if(user.user == req.body.username){
      appstatus = user.applicationStatus
    }
  });
  
  res.send('Application status: ' + appstatus + '\n');
})

app.post("/getInfo", function (req, res) {
  console.log(req.body.username)
  try {
    const userName = req.body.username;
    const fields = {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      address: "",
      emailAddress: "",
      contactMethod: "",
      paymentMethod: "",
    };
    console.log(userName)
    base("Users")
      .select({ filterByFormula: `Username = "${userName}"` })
      .firstPage((err, records) => {
        console.log("records: " + JSON.stringify(records))
        if (err) console.error(err);
        //console.log("what is this: " + JSON.stringify(records))
        if (records.length != 1)
          res.status(401).send({ error: "No such user exists" });
        const recordID = records[0].fields['FR Record ID'];
        console.log('recordId: ' + JSON.stringify(recordID))
        base("2021 Form Responses").find(recordID, (err, record) => {
          if (err) {
            console.error(err);
            return;
          }
          if (record) {
            const {
              "Applicant First and Last Name" : fullName,
              "Applicant Phone": phoneNum,
              "Delivery Address": addr,
              "Applicant Email": eAddr,
              "Preferred Contact Method": contact,
              "Funding Type": fType,
              ...rest
            } = record.fields;
            
            //console.log("actual record: " + JSON.stringify(record))
            //console.log(Object.keys(record.fields))
            //console.log(record.fields['FR Record ID'])
            const first = fullName.split(' ')[0];
            const last = fullName.split(' ')[1];
            fields.firstName = first;
            fields.lastName = last;
            fields.phoneNumber = phoneNum;
            fields.address = addr;
            fields.emailAddress = eAddr;
            fields.contactMethod = contact;
            fields.paymentMethod = fType;
            res.write(JSON.stringify(fields));
          } else {
            res.write(JSON.stringify(null));
          }
          res.end();
        });
      });
  } catch (err) {
    console.error(err);
    throw err;
  }
});




app.listen(port, () => {
  console.log("Server live on port: 3000")
})
