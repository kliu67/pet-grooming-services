import { pool } from "../db.js";
import { isValidId } from "../utils/helper"


export async function findById(id) {

    //check if id is number
    const sanitizedId = Number(id);
    if (isNaN(sanitizedId)) {
        throw new Error('ID must be a number');
    }

    //check if id is null or empty
    if(sanitizedId < 1){
        throw new Error('ID is invalid');
    }

    const {rows} = await pool.query(
        `SELECT id, name, base_price, uuid, created_at FROM services
        WHERE id = $1`,
        [sanitizedId]
    );

    return rows[0] ?? null;

}

export async function findAll(){
    const { rows } = await pool.query(
        `SELECT id, name, base_price, uuid, created_at FROM services`
    )
}

export async function create({name, base_price}){
    //name cannot be empty, null or undefined
    if(!name){
        throw new Error('data validation error: name cannot be empty, null, or undefined')
    }

    //base_price cannot be null or undefined
    if(Number(base_price) == NaN){
        throw new Error('data validation error: base_price cannot be null, or undefined')
    }

    if(Number(base_price) < 0){
        throw new Error('data validation error: base_price cannot be negative');
    }

    try{
        const { rows } = await pool.query(
            `INSERT INTO services(name, base_price)
            VALUES ($1, $2)
            RETURNING id, name, base_price, uuid, created_at`,
            [name, base_price]
        )
        return rows[0] ?? null;
    }

    catch(err){
        //unique violation code
        if(err.code === '23505'){
            if(err.details.includes('name')){
                throw new Error(`data validation error: Service with name ${name} already exists`);
            }
        }
        throw new Error(err.message);
    }
}

export async function update(id, {name='', base_price=''}){
    if(!isValidId(id)){
        throw new Error('data validation error: ID is invalid')
    }

    if(!name){
        throw new Error('data validation error: name cannot be empty, null, or undefined')
    }

     if(Number(base_price) == NaN){
        throw new Error('data validation error: base_price cannot be null, or undefined')
    }

    if(Number(base_price) < 0){
        throw new Error('data validation error: base_price cannot be negative');
    }

    const {rows} = await pool.query(
        `
        UPDATE services
        SET name = $1, base_price = $2
        WHERE id = $3
        RETURNING *`,
        [name, base_price, id]
    )
    
    if(!rows[0]){
        throw new Error(`Service with id ${id} not found`);
    }

    return rows[0];
}

export async function remove(id){
    if(!isValidId(id)){
        throw new Error('data validation error: ID is invalid')
    }

    const { rowCount } = await pool.query(
        `DELETE FROM services WHERE id = $1`,
        [id]
    );

    if( rowCount === 0){
        throw new Error(`Service with id ${id} not found`);
    }
    return rowCount > 1;
}