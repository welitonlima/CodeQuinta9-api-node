const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');

const authConfig = require('../../config/auth');

const User = require('../models/User');

const router = express.Router();

function generateToken(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,// 86400 segundos = 1 dia
    });
}

router.post('/register', async (req, res) => {

    const { email } = req.body;

    try 
    {
        if (await User.findOne({ email }))
            return res.status(400).send({error: "Usuaro já cadastrado"});
        
        const user = await User.create(req.body);

        user.password = undefined;
        
        return res.send({
            user,
            token: generateToken({ id: user.id }),
        });
    }
    catch(err)
    {
        return res.status(400).send({error: 'Registration failed'});        
    }

});

router.post('/authenticate', async (req, res) => {

    
    const { email, password} = req.body;

    const user = await User.findOne({ email }).select('+password');

    if(!user)
        return res.status(400).send({error: 'Usuário não localizado'});

    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({error: 'Senha ou Usuário inválido'});

    res.password = undefined;

    res.send({ 
        user, 
        token: generateToken({ id: user.id }),
    });

});


router.post('/forgot_password' , async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user)
            return res.status(400).send({ error: "Usuário não encontrado" });


        const token = crypto.randomBytes(20).toString('hex');

        const now = new Date();
        now.setHours(now.getHours() + 1 ); // uma hora a mais
        
        await User.findByIdAndUpdate(user.id, {
           '$set' : {
               passwordResetToken: token,
               passwordResetExpires: now,
           }
        });

        mailer.sendMail({
            to: email,
            from: 'welitonpl@gmail.com',
            template: 'auth/forgot_password',
            context: { token },
        }, (err) => {
            if(err)
                //return res.status(400).send({ error: 'Não envio o email de resgate de senha'});
                console.log(err);
                
            console.log(token);

            return res.send();
        })

    }
    catch(err)
    {
        console.log(err);
        res.status(400).send({ error: 'Erro no gerar nova senha' });
    }    
});


router.post('/reset_password', async(req, res) => {
    const { email, token, password } = req.body;

    try{
        const user = await User.findOne({ email })
        .select('+passwordResetToken passowordResetExpires');

        if(!user)
            return res.status(400).send({ error: 'Usuáio não encontrado' });
        
        if(token !== user.passwordResetToken)
            return res.status(400).send({ error: 'Token inválido' });

        const now = new Date();

        if( now > user.passwordResetExpires)
            return res.status(400).send({ error: 'Token expirado, gere outro' });
        
        user.password = password;

        await user.save();

        res.send();

    }
    catch(err)
    {
        res.status(400).send({ error: 'Erro ao tentar resetar senha' });
    }

});



module.exports = app => app.use('/auth', router);