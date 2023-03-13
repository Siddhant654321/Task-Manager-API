const express = require('express');
const mongoose = require('./db/mongoose');
const app = express();
const port = process.env.PORT;
const userRouter = require('./routers/users');
const taskRouter = require('./routers/tasks');

app.use(express.json());
app.use(taskRouter);
app.use(userRouter);

app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`)
})

