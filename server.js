var app = require("express")();
var session = require('express-session');
var mysql = require("mysql");
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require("socket.io")(http);
var fs= require("fs")



app.use(session({
    secret: "online",
    resave: true,
    saveUninitialized: true
}));
var session_data;


app.use(require("express").static('data'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


var con    =    mysql.createPool({
      connectionLimit   :   100,
      host              :   'localhost',
      user              :   'root',
      password          :   'prab',
      database          :   'dbms'
});


app.get("/",function(req,res){
    res.sendFile(__dirname + '/index.html');
});



io.on('connection',function(socket){  
    socket.on('update_list',function(data){
      //data.purpose;
      
      
      if((String(data.purpose.trim()))=='login'){
        var query="update student set online = ? where id = ?";
        con.query(String(query),['Y',data.id],function(err,rows){
         // var query="select * from user where id !='"+data.id+"'";
          var query="select * from student";
          con.query(String(query),function(err,rows){
            io.emit('logout update',JSON.stringify(rows));
          });
        });
      }else{
        var query="update student set online = ? where id = ?";
        con.query(String(query),['N',data.id],function(err,rows){
          //var query="select * from user where id !='"+data.id+"'";
          var query="select * from student";
          con.query(String(query),function(err,rows){
            io.emit('logout update',JSON.stringify(rows));
          });
        });
      }
    });
});

app.post('/login', function (req, res) {
  session_data=req.session;
  
  data = {
    name:req.body.name,
    password:req.body.password,
  };
  session_data.password=data.password;
  session_data.name=data.name;
  var obj={};
  var query="select * from student where name='"+data.name+"' and password='"+data.password+"'";
      con.query(String(query),function(err,rows){
        if(rows.length > 0){
          var un=new Buffer(String(rows[0].name)).toString('base64');
          var ui=new Buffer(String(rows[0].id)).toString('base64');
          obj.path_name="/home.html#?un="+un+"&ui="+ui;
          res.write(JSON.stringify(obj));
          res.end();
        }else{
          obj.path_name="invalid";
          res.write(JSON.stringify(obj));
          res.end();
        }
    });
});

app.get('/home', function (req, res) {
  session_data=req.session;
  if(session_data.name){
    res.sendFile(__dirname + '/data/home.html');
  }else{
    res.redirect('/');
  }
});

app.post('/get_list', function (req, res) {
  var query="select * from student";
  con.query(String(query),function(err,rows){
    res.write(JSON.stringify(rows));
    res.end();
  });
});

app.post('/logout', function (req, res) {
  var query="update student set online = ? where id = ?";
  con.query(String(query),['N',req.body.id],function(err,rows){});
  req.session.destroy(function(err){
  res.end();
  });
});


app.post("/upload",function(req,res){
    var multiparty = require('multiparty');
   var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
       //res.send("name:"+fields.name);
       
       var img =files.images[0];
       var fs = require("fs");
      // console.log(img.path);
       fs.readFile(img.path,function(err,data){
        var path ="/home/prab/Upload/uploads/"+img.originalFilename;
       // console.log(path);
        fs.writeFile(path,data,function(error){
          if(error)console.log("error");
          var query="select usn from student where online='Y'";
          con.query(String(query),function(err,rows)
            {

             var u=rows[0].usn;
            var query="select * from notes";
            con.query(String(query),function(err,row)
              {  
              //  console.log(row);
                var idnum=row.length;
               // console.log(idnum);
                var data={
                   notes_id: Number(idnum)+1,
                   posted_by: u,
                   filename: img.originalFilename,
                   path: path,
                   course_name: '-'

                };
                var query="insert into notes set ?";
                con.query(String(query),data,function(err,result)
                  {
                    if(err)
                     res.end("error");
                    else
                      res.sendFile(__dirname + '/data/course.html');
                  });

              });
                 
            });
          
        });
       });
    });
  });

app.post('/register',function(req,res)
{
 

var idnum=0;
var prequery="select * from student";
con.query(String(prequery),function(err,rows)
  {
      if(!err)
        
        {
          idnum=rows.length;

var data =
{
  id: idnum+1,
  name: req.body.username,
  usn: req.body.usn,
  password: req.body.regpass,
  department: '-',
  sem: '-',
  online: 'N'
};

 
var query = con.query('INSERT INTO student SET ?', data, function(err, result) {
       if(err)
        res.end("Erorr");
      else
        res.sendFile(__dirname + '/data/back.html');
        

  
});
            

        }

  });



});
//console.log(query.sql);

app.post('/redirect',function(req,res)
  {
     res.sendFile(__dirname + '/data/index.html');

  });



app.post('/insert',function(req,res)
{
  

   var query="select usn from student where online ='Y'";
  con.query(String(query),function(err,rows)
    {
         if(err)
          res.end(err);
         else
          {
            //console.log(JSON.stringify(rows));
           var u=rows[0].usn;
           // console.log(u);
            var query="select course_id from course where name='"+req.body.coursename+"'";
            con.query(String(query),function(err,result)
            	{
            		if(err)
            			res.end("Error");
            		else
            		{
            			if(result.length>0)
            			{
                  //console.log(JSON.stringify(result));
                  var c=result[0].course_id;
                  //console.log(c);
                  var data=
            {
              course_id: c,
              name: req.body.coursename,
              usn: u,
              faculty: '-',
              department: '-',
              hours: '-'

            };
            query="insert into course set ?";
            con.query(String(query),data,function(err,rows)
              {
                 if(err)
                  res.send("Erorr");
                  else
                  {
                res.sendFile(__dirname + '/data/up.html');
                   }
              });
                 } 
                 else
                 {
                 	  var query="select * from course";
                    con.query(String(query),function(err,data)
                      {
                           var c=data.length;
                           var data={
                            course_id: Number(c)+1,
              name: req.body.coursename,
              usn: u,
              faculty: '-',
              department: '-',
              hours: '-'
                           };

                           var query="insert into course set ?";
                           con.query(String(query),data,function(err,rows)
                            {
                                if(err)
                                  res.send("error");
                                else
                                  res.sendFile(__dirname + '/data/up.html');

                            });

                      });

                 }
        }
                 
            	});
            	
            
             
          }

    });

   

  });
  


app.post('/delete',function(req,res)
{

var query="select usn from student where online='Y'";
con.query(String(query),function(err,rows)
  {
if(err)
  res.end("error");
else
{    
	var u=rows[0].usn;

	var query="select * from course where name='"+req.body.deletename+"' and usn='"+u+"'";
	con.query(String(query),function(err,col)
		{
             if(err)
             	res.end("errorrr");
             else
             {
             	if(col.length>0)
             	{
             		 var query="delete from course where name='"+req.body.deletename+"' and usn='"+u+"'";
                     con.query(String(query),function(err,data)
      {
          if(err)
             res.end("Error");
           else
            res.end("delete Succesfully done");

      });

             	}
             	else
             		res.end("No such course found in the courses you have subscribed");
             }

		});
    
    

}

  });

});


app.post('/view',function(req,res)
  {

     var query="select usn from student where online='Y'";
     con.query(String(query),function(err,data)
     	{

             var u=data[0].usn;
            //console.log(u);
            var query="select distinct name from course where usn='"+u+"'";
     con.query(String(query),function(err,data)
     {

           if(err)
            res.end("Cant Show");
          else   	
          {  

            if(data.length>0)
            res.send(JSON.stringify(data));
          else
            res.send("You have not added any course to your account");
          }

     });

     	});
     

  });

app.post('/update',function(req,res)
	{
      res.sendFile(__dirname + '/data/update.html');


	});

app.post('/update_done',function(req,res)
	{
   
   var query="select usn from student where online='Y'";
   con.query(String(query),function(err,data)
    {
          var u=data[0].usn;
          var query="update student set ? where usn='"+u+"'";
          var input={
            department: req.body.newdept,
            sem: req.body.newsem
          };
          con.query(String(query),input,function(err,d)
            {
                    if(err)
                     res.end("error");
                    else
                      res.sendFile(__dirname + '/data/update_done.html');

            });

    });



	});

app.post('/allcourses',function(req,res)
  {

     var query="select department from student where online='Y'";
     con.query(String(query),function(err,data)
      {
           var dept=data[0].department;
           var query="select distinct name from course where department='"+dept+"'";
           con.query(String(query),function(err,rows)
            {
                if(err)
                  res.end("error");
                else
                {
                    if(rows.length>0)
                    {
                        res.send(JSON.stringify(rows));
                    }
                    else
                    {
                            var query="select usn from student where online='Y'";
                            con.query(String(query),function(err,data)
                              {
                                    var u=data[0].usn;
                                    var query="select * from student where department='-' and usn='"+u+"'";
                                    con.query(String(query),function(err,d)
                                      {
                                        if(d.length>0)
                                        {
                                          res.end("Please Update your profile and then try again");
                                        }
                                        else
                                        {
                                          res.end("No courses offered by your department now");
                                        }
                                      });

                              });
                            
                    }

                }

            });

      });

  });

app.post('/updatecourse',function(req,res)
  {
      var c=req.body.cname;
      var query="select * from notes";
       con.query(String(query),function(err,data)
        {
          var idnum=data.length;
          var query="update notes set course_name='"+c+"' where notes_id='"+idnum+"' ";
      con.query(String(query),function(err,data)
        {
                if(err)
                  res.end("error");
                else
                  res.sendFile(__dirname + '/data/update_done.html');

        });


        });
      


  });

app.post('/my_files',function(req,res){

var query="select usn from student where online='Y'";
con.query(String(query),function(err,data)
  {
    

                var u=data[0].usn;
            var query="select filename from notes where posted_by='"+u+"'";
            con.query(String(query),function(err,rows)
              {

                  if(rows.length>0)
                    res.send(JSON.stringify(rows));
                  else
                    res.end("You have not uploaded any images");

              });


  });

});

app.post('/deptuploads',function(req,res)
  {

      var query="select filename from notes where course_name='"+req.body.dept+"'";
      con.query(String(query),function(err,data)
        {

           if(data.length>0)
            res.send(JSON.stringify(data));
          else
            res.send("No uploads found for this course");

        });


  });



app.post('/up',function(req,res)
  {
        var query="select usn from student where online='Y'";
        con.query(String(query),function(err,data)
          {
               var u=data[0].usn;
               
               var query="select course_id from course where faculty='-' and usn='"+u+"'";
               con.query(String(query),function(err,d)
                {
                    var cid=d[0].course_id;
                     var query="update course set ? where usn='"+u+"' and course_id='"+cid+"'";
                     var input={
                   faculty: req.body.faculty,
                   department: req.body.dep,
                   hours: req.body.hours

               };
        
                    con.query(String(query),input,function(err,data)
          {
            if(err)
              res.end("Error");
            else
              res.sendFile(__dirname + '/data/update_done.html');
          });

          });

                });
      
  });


app.post('/changepass',function(req,res)
  {
          var query="select usn from student where online='Y'";
          con.query(String(query),function(err,data)
            {
              var u=data[0].usn;
              var query="update student set password='"+req.body.newpass+"' where usn='"+u+"'";
              con.query(String(query),function(err,d)
                {
                  if(err)
                    res.end("errorrrrrr");
                  else
                    res.sendFile(__dirname + '/data/update_done.html');
                });
            });

  });

app.post('/teacher',function(req,res)
  {
      var query="select * from faculty where name='"+req.body.prof+"'";
      con.query(String(query),function(err,d)
        {
                 if(err)
                  res.end("err");
                else
                {
                  if(d.length>0)
                    res.send(JSON.stringify(d));
                  else
                    res.send("No professor of given name found");
                }

        });

  });


http.listen(3000,function(){

    console.log("Server Running on 3000");
});
