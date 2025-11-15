
const lowerCase="abcdefghijklmnopqrstuvwxyz";
const upperCase="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers="0123456789";
const symbols = "!@#$%^&*()_+-=[]{}\\|;':\"],./<>?";

const lent=document.getElementById('len');
const l_case=document.getElementById('l-case');
const u_case=document.getElementById('u-case');
const number=document.getElementById('num');
const symbol=document.getElementById('sym');
const gbtn=document.getElementById('gen-btn');
const display=document.getElementById('showPassword')

gbtn.addEventListener('click', function(){
    let len=lent.value;
    let characters="";
    let password="";

    if (l_case.checked){
        characters += lowerCase;
    }

    if (u_case.checked){
        characters += upperCase;
    }
    
    if (number.checked){
        characters += numbers;
    }
    
    if (symbol.checked){
        characters += symbols;
    }
    
    for (let i = 0; i < len; i++){
        
        password += characters.charAt(Math.floor(Math.random() * characters.length));
        
    }
    
    display.value = password;
    
})

