import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';

const servidor = express();
const portaServidor = 3000;

// Configuração do middleware
servidor.use(session({
    secret: 'SegredoSuperSeguro123',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 1800000 } // 30 minutos
}));
servidor.use(cookieParser());
servidor.use(express.urlencoded({ extended: true }));
servidor.use(express.static(path.join(process.cwd(), './pages/public')));

// Banco de dados em memória
let baseDeUsuarios = [];
let historicoDeMensagens = [];

// Cadastro automático do administrador
const admin = { nome: 'admin', senha: 'admin123' };
baseDeUsuarios.push(admin);
console.log('Administrador criado automaticamente:', admin);

// Middleware de verificação de login
function autenticarSessao(req, res, next) {
    if (!req.session.autenticado) {
        return res.redirect('/login');
    }
    next();
}

// Página de login
servidor.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Login</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f4f8;
                    text-align: center;
                    padding-top: 50px;
                }
                form {
                    display: inline-block;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                input, button {
                    display: block;
                    margin: 10px auto;
                    padding: 10px;
                }
            </style>
        </head>
        <body>
            <h2>Login</h2>
            <form method="POST" action="/login">
                <input type="text" name="username" placeholder="Usuário" required />
                <input type="password" name="password" placeholder="Senha" required />
                <button type="submit">Entrar</button>
            </form>
        </body>
        </html>
    `);
});

// Página inicial
servidor.get('/', autenticarSessao, (req, res) => {
    const ultimaVisita = req.cookies.dataUltimaVisita || 'Nunca acessou antes';
    res.cookie('dataUltimaVisita', new Date().toLocaleString(), { httpOnly: true });
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Página Inicial</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f4f8;
                    text-align: center;
                    padding-top: 50px;
                }
                a {
                    display: block;
                    margin: 10px;
                    padding: 10px;
                    text-decoration: none;
                    background: #007bff;
                    color: white;
                    border-radius: 5px;
                }
            </style>
        </head>
        <body>
            <h1>Bem-vindo, ${req.session.usuario.nome}!</h1>
            <p>Sua última visita foi: <strong>${ultimaVisita}</strong></p>
            <a href="/registrar">Registrar Usuário</a>
            <a href="/chat">Ir para o Chat</a>
            <a href="/logout">Sair</a>
        </body>
        </html>
    `);
});

// Página de registro
servidor.get('/registrar', autenticarSessao, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Registrar</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f4f8;
                    text-align: center;
                    padding-top: 50px;
                }
                form {
                    display: inline-block;
                    padding: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                input, button {
                    display: block;
                    margin: 10px auto;
                    padding: 10px;
                }
                a {
                    display: block;
                    margin: 10px auto;
                    text-decoration: none;
                    color: #007bff;
                }
            </style>
        </head>
        <body>
            <h2>Cadastro</h2>
            <form method="POST" action="/adicionarUsuario">
                <input type="text" name="nome" placeholder="Seu nome" required />
                <input type="password" name="senha" placeholder="Senha" required />
                <button type="submit">Registrar</button>
            </form>
            <a href="/">Voltar</a>
        </body>
        </html>
    `);
});

// Página de chat
servidor.get('/chat', autenticarSessao, (req, res) => {
    const optionsUsuarios = baseDeUsuarios
        .map(user => `<option value="${user.nome}">${user.nome}</option>`)
        .join('');

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Chat</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f0f4f8;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    width: 60%;
                    margin: 50px auto;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                }
                h2 {
                    color: #333;
                    text-align: center;
                }
                .chat-messages {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    height: 300px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                    background: #fafafa;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                select, textarea, button {
                    padding: 10px;
                }
                a {
                    text-decoration: none;
                    color: #007bff;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Bate-papo</h2>
                <div class="chat-messages">
                    ${historicoDeMensagens.map(msg => `<p><strong>${msg.usuario}:</strong> ${msg.texto}</p>`).join('')}
                </div>
                <form method="POST" action="/novaMensagem">
                    <label for="usuario">Selecionar usuário:</label>
                    <select name="usuario" required>
                        ${optionsUsuarios}
                    </select>
                    <textarea name="texto" rows="4" placeholder="Digite sua mensagem..." required></textarea>
                    <button type="submit">Enviar</button>
                </form>
                <a href="/">Voltar</a>
            </div>
        </body>
        </html>
    `);
});

// Logout
servidor.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// Processa o registro
servidor.post('/adicionarUsuario', autenticarSessao, (req, res) => {
    const { nome, senha } = req.body;

    // Validações
    if (!nome || !senha) {
        return res.send(`
            <h1>Erro: Todos os campos são obrigatórios!</h1>
            <a href="/registrar">Voltar</a>
        `);
    }

    const usuarioExistente = baseDeUsuarios.find(user => user.nome === nome);
    if (usuarioExistente) {
        return res.send(`
            <h1>Erro: Usuário já existe!</h1>
            <a href="/registrar">Voltar</a>
        `);
    }

    baseDeUsuarios.push({ nome, senha });
    res.redirect('/');
});

// Processa mensagens
servidor.post('/novaMensagem', autenticarSessao, (req, res) => {
    const { texto, usuario } = req.body;

    // Validações
    if (!usuario || !texto.trim()) {
        return res.send(`
            <h1>Erro: Todos os campos são obrigatórios!</h1>
            <a href="/chat">Voltar</a>
        `);
    }

    historicoDeMensagens.push({ usuario, texto });
    res.redirect('/chat');
});

// Página de erro para login inválido
servidor.post('/login', (req, res) => {
    const { username, password } = req.body;

    const usuarioValido = baseDeUsuarios.find(user => user.nome === username && user.senha === password);

    if (usuarioValido) {
        req.session.autenticado = true;
        req.session.usuario = usuarioValido;
        return res.redirect('/');
    }

    res.send(`
        <h1>Login inválido!</h1>
        <a href="/login">Tentar novamente</a>
    `);
});

// Inicia o servidor
servidor.listen(portaServidor, () => {
    console.log(`Servidor disponível em http://localhost:${portaServidor}`);
});
