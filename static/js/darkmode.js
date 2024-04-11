const darkModeSwitch=document.getElementById('darkmode-toggler');
darkModeSwitch.onchange=function(){
  const html = document.documentElement;
  if(this.checked){
    html.setAttribute('data-bs-theme','dark');
    return;
  }
  html.setAttribute('data-bs-theme','light');
}