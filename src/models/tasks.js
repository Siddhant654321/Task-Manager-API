const mongoose = require('mongoose');
const TaskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, {
    timestamps: true
})


const Tasks = mongoose.model('Tasks', TaskSchema)

const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = Tasks;