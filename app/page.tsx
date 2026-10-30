import Studio from './studio';
import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 if (!user) return <main className="login"><div className="login-art"><span className="brand">◈ órbita<span>AR STUDIO</span></span><div className="orbital">◈</div><h1>Ideas que salen<br/>de la pantalla.</h1><p>Crea una nueva dimensión para tu marca.</p></div><div className="login-form"><span className="eyebrow">TU ESPACIO CREATIVO</span><h2>Bienvenido a Órbita</h2><p>Gestiona tus targets, personaliza tus modelos y dale vida a tus experiencias de realidad aumentada.</p><a className="button primary" href={chatGPTSignInPath('/')} target="_top">Iniciar sesión con ChatGPT ↗</a><small>Acceso privado · Tus proyectos en un solo lugar</small></div></main>;
 return <Studio name={user.fullName || user.email.split('@')[0]} />;
}
