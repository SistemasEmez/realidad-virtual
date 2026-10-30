import Studio from './studio';
import PanelLogin from './panel-login';
import {getPanelUser,setupComplete,canInitialize} from '../lib/panel-auth';
import {chatGPTSignInPath} from './chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Home(){
 const configured=await setupComplete();
 if(!configured)return <PanelLogin setup canSetup={!!await canInitialize()} signInPath={chatGPTSignInPath('/')}/>;
 const user=await getPanelUser();
 if(!user)return <PanelLogin/>;
 return <Studio name={user.displayName} role={user.role}/>;
}
