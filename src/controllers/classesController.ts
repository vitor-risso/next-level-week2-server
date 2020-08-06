import { Response , Request, request} from 'express';
import convertHourToMinute from "../utils/convertHourToMinute";
import db from "../database/connection";



interface schaduleItem {
    week_day: number,
    from: string,
    to: string
}

export default class ClassController{

async index (request: Request, response: Response){
    const filters = request.query;

    if(!filters.subject || !filters.week_day || !filters.time){
        return response.status(400).json({
            error: 'Missing filters serachign classes'
        })
    }

    const subject = filters.subject as string
    const week_day = filters.week_day as string
    const time = filters.time as string

    const timeInMinutes = convertHourToMinute(time);

    const classes = await db('classes')
        .whereExists(function(){
            this.select('class_schedule.*')
                .from('class_schedule')
                .whereRaw('`class_schedule`.`class_id` = `classes`. `id`')
                .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])

        })
        .where('classes.subject', '=', subject )
        .join('users', 'classes.user_id', '=', 'users.id')
        .select(['classes.*' , 'users.*']);

    console.log(timeInMinutes);

    return response.json(classes);
}

async create (request: Request, response: Response) {
    const {
        name,
        avatar,
        whatsapp,
        bio,
        subject,
        cost,
        schedule
    } =request.body;

    const trx = await db.transaction();

    try{

    const insertUsersIds = await trx('users').insert({
        name,
        avatar,
        whatsapp,
        bio,
    });

    const user_id = insertUsersIds[0];

   const insertedClassesIds =  await trx('classes').insert({
        subject,
        cost,
        user_id
    });

    const class_id = insertedClassesIds[0];

    const classSchedule = schedule.map((scheduleItem: schaduleItem) => {
        return{
            week_day: scheduleItem.week_day,
            from: convertHourToMinute(scheduleItem.from),
            to: convertHourToMinute(scheduleItem.to),
            class_id,

        };
    });

    await trx('class_schedule').insert(classSchedule);

    await  trx.commit()

    return response.status(201).send();
    } catch (err){
        console.log(err)
        
        await trx.rollback();
        return response.status(400).json({
            error: 'Unexpected erro while creating new class'
        })
    }
 }
}