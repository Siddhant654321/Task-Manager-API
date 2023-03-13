const express = require('express');
const Tasks = require('../models/tasks');
const Users = require('../models/user');
const auth = require('../middleware/auth')
const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {
    req.body.userId = req.user._id;
    const newTask = new Tasks(req.body);
    try{
        await newTask.save();
        res.status(201);
        res.send(newTask);
    } catch(e) {
        res.status(400).send(e);
    }
})

router.get('/tasks', auth, async (req, res) => {
    try{
        let match = {};
        let sort = {};
        if(req.query.completed == 'true' || req.query.completed == 'false'){
            match = {completed: req.query.completed}
        }
        if(req.query.sortBy){
            sortBy = req.query.sortBy.split(':');
            sortBy[1] = (sortBy[1] == 'desc') ? -1:1;
            sort[sortBy[0]] = sortBy[1];
        }
        const allTasks = await req.user.populate({
            path: 'tasks',
            match,
            options: {
                    limit: parseInt(req.query.limit) || null,
                    skip: parseInt(req.query.skip) || null,
                    sort
                }
        });
        res.send(allTasks.tasks);
        
    } catch(e) {
        res.status(500).send(e);
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try{
        const task = await Tasks.findOne({userId: req.user._id, _id: req.params.id});
        if(task){
            res.send(task);
        } else {
            res.status(404).send();
        }
    } catch(e){
        res.status(404).send();
    }
    
})


router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['name', 'completed'];
    const updates = Object.keys(req.body);
    const isValid = updates.every(value => allowedUpdates.includes(value));
    if(!isValid){
        return res.status(400).send({error: 'Invalid updates'});
    }
    try{
        let task = await Tasks.findOne({_id: req.params.id, userId: req.user.id})
        updates.forEach(value => task[value] = req.body[value]);
        task = await task.save();
        if(task){
            return res.send(task);
        }
        res.status(404).send();
    } catch(e){
        res.status(400).send(e);
    }
})

router.delete('/tasks/:id', auth, async(req,res) => {
    try {
        const user = await Tasks.findOneAndDelete({_id: req.params.id, userId: req.user.id})
        if(user){
            return res.send(user);
        }
        res.status(404).send();
    } catch (e) {
        res.status(500).send();
    }
})

module.exports = router;