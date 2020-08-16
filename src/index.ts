import { SimApp } from './SimApp'
import { PreviewApp } from './PreviewApp'
import './sass/ui.scss';



if(window.location.hash == '#preview') {
  new PreviewApp();
} else {
  new SimApp();
}
