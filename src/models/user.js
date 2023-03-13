const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const Tasks = require('./tasks');
const jwt = require('jsonwebtoken');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        validate(value) {
            if(value<0){
                throw new Error('Age must be a positive number')
            }
        },
        default: 0
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid');
            }
        },
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(value){
            if(value.includes('password')){
                throw new Error("The password cannot contain the word 'password' in it.")
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Tasks',
    localField: '_id',
    foreignField: 'userId'
})

userSchema.pre('save', async function (next) {
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
})

userSchema.pre('remove', async function(next){
    await Tasks.deleteMany({userId: this._id});
    next();
})

userSchema.statics.findByCredentials = async (email, password) => {
    if(email || password){
        try{
            const user = await Users.findOne({email});
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if(isPasswordValid){
                return user;
            }
            throw new Error('Incorrect password');
        } catch (e){
            throw new Error('No user with this email exist');
        }
    } else {
        throw new Error('Please provide both email and password')
    }
}

userSchema.methods.getProfileData = function() {
    const obj = this.toObject();
    delete obj.tokens;
    delete obj.password;
    delete obj.avatar;
    return obj;
}

userSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
    this.tokens.push({token});
    await this.save();
    return token;
}

const Users = mongoose.model('Users', userSchema);

module.exports = Users;