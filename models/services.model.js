import { pool } from "../db.js";
import { isValidId } from "../utils/helpers.js";
import { validateNumericId } from "../validators/validator.js";
import { isIdValidNumeric } from  "../validators/validator.js";

function normalizeSpecies(species) {
    if (species === undefined) return null;
    if (species === null) return null;
    if (typeof species !== "string") {
        throw new Error("data validation error: service species must be a string");
    }

    const trimmed = species.trim();
    if (trimmed === "") return null;
    if (trimmed.length > 60) {
        throw new Error("data validation error: service species cannot exceed 60 characters");
    }
    return trimmed;
}

export async function findAll(){
    const { rows } = await pool.query(
        `SELECT id, name, species AS service_species, base_price, code, description, uuid, created_at FROM services`
    )
    return rows ?? null;
}

/**
 * Get service by id
 */
export async function findById(id) {

    const sanitizedId = validateNumericId(id);
    const {rows} = await pool.query(
        `SELECT id, name, species AS service_species, base_price, description, uuid, created_at FROM services
        WHERE id = $1`,
        [sanitizedId]
    );
    return rows[0] ?? null;

}


/**
 * 
 * @param {create service} param0 
 * @returns 
 */
export async function create({name, base_price, description, service_species, species}){
    //name cannot be empty, null or undefined
    if(!name){
        throw new Error('data validation error: name cannot be empty, null, or undefined')
    }

    //description cannot be empty, null or undefined
    if(!description){
        throw new Error('data validation error: description cannot be empty, null, or undefined')
    }
    //base_price cannot be null or undefined
    if(isNaN(Number(base_price))){
        throw new Error('data validation error: base_price cannot be null, or undefined')
    }

    if(Number(base_price) < 0){
        throw new Error('data validation error: base_price cannot be negative');
    }

    const normalizedSpecies = normalizeSpecies(service_species ?? species);
    const serviceCode = name.trim().toUpperCase().replace(/\s+/g, "_");

    try{
        const { rows } = await pool.query(
            `INSERT INTO services(name, species, code, base_price, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, species AS service_species, code, base_price, uuid, created_at`,
            [name, normalizedSpecies, serviceCode, base_price, description]
        )
        return rows[0] ?? null;
    }

    catch(err){
        //unique violation code
        if(err.code === '23505'){
            if(err.detail.includes('name')){
                throw new Error(`data validation error: Service with name ${name} already exists`);
            }
        }
        throw new Error(err.message);
    }
}

export async function update(id, {name='', description='', base_price='', service_species, species}){
  if (!isIdValidNumeric(id)) {
    throw new Error(`data validation error: id ${id} is invalid`);
  }
    if(!name){
        throw new Error('data validation error: name cannot be empty, null, or undefined')
    }

    if(!description){
        throw new Error('data validation error: description cannot be empty, null, or undefined')
    }

     if(isNaN(Number(base_price))){
        throw new Error('data validation error: base_price cannot be null, or undefined')
    }

    if(Number(base_price) < 0){
        throw new Error('data validation error: base_price cannot be negative');
    }

    const normalizedSpecies = normalizeSpecies(service_species ?? species);
    const {rows} = await pool.query(
        `
        UPDATE services
        SET name = $1, species = $2, base_price = $3, description = $4
        WHERE id = $5
        RETURNING id, name, species AS service_species, code, base_price, description, uuid, created_at`,
        [name, normalizedSpecies, base_price, description, id]
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

    return rowCount === 1;
}
