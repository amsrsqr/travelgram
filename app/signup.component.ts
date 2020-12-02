import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

//Services
import { AuthService } from 'src/app/services/auth.service';

// Angular Form
import {NgForm} from "@angular/forms"
import {finalize} from 'rxjs/operators';

//Firebase
import { AngularFireStorage } from '@angular/fire/storage';
import {AngularFireDatabase} from "@angular/fire/database";

//Browser image resizer
import { readAndCompressImage} from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  picture:string="https://learnyst.s3.amazonaws.com/assets/schools/2410/resources/images/logo_lco_i3oab.png";
  
  uploadPercent:number=null;

constructor
  (
      private auth:AuthService,
      private router:Router,
      private db:AngularFireDatabase,
      private storage:AngularFireStorage,
      private toastr:ToastrService
  )
   { }
  
ngOnInit(): void
   {
  
   }
onSubmit(f: NgForm)
   {
     const {email,password,username,country,bio,name}=f.form.value;
     //furuther sanitization- do here
     this.auth.signUp(email,password)
     .then((res)=>{
       console.log(res);
       const{uid}=res.user

       this.db.object(`/users/${uid}`)
       .set({
         id:uid,
         name:name,
         email:email,
         instaUserName:username,
         country:country,
         bio:bio,
         picture:this.picture
       })
     })
    
     .then(()=>{
       this.router.navigateByUrl('/');
       this.toastr.success("signUp Success")
     })
    
     .catch((err)=>{
       this.toastr.error("signUp failed")
     });
   }

  async uploadFile(event){
    const file=event.target.files[0];

     let resizedImage=await readAndCompressImage(file,imageConfig)
     const filePath = file.name //rename the image TODO :UUID 
     const fileRef=this.storage.ref(filePath)

     const task=this.storage.upload(filePath,resizedImage);

     task.percentageChanges().subscribe((Percentage)=>{
       this.uploadPercent=Percentage
     });


     task.snapshotChanges()
     
     .pipe(
      finalize(()=>{
        fileRef.getDownloadURL().subscribe((url) =>{
          this.picture=url;
          this.toastr.success('image upload success')
        });
      }),
    )
     .subscribe()
    

  }
}
