import db from '../db/conexion';
import { Cancion } from '../models/Cancion';
import { CancionesLista } from '../models/CancionesLista';
import { Lista } from '../models/Lista';

class ListasRepository{

    //#region OBTENER

    async ObtenerListas(idLista:any){
        const connection = await db.getConnection();
        
        try {
            let query:string = 'SELECT * FROM listas';
            if(idLista)
                query = query + ' WHERE id = ?';
          
            const [rows] = await connection.query(query, idLista?[idLista]:null);
            const listas:Lista[] = [];

            if (Array.isArray(rows)) {
                for (let i = 0; i < rows.length; i++) { 
                    const row = rows[i];

                    let lista:Lista = new Lista({
                        id: row['id'],
                        nombre: row['nombre'],
                        color: row['color'],
                    });

                    lista.canciones = await ObtenerCancionesLista(connection, lista.id!);

                    listas.push(lista);
                  }
            }

            return listas;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    //#endregion

    //#region ABM
    async Agregar(data:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            let existe = await ValidarExistencia(connection, data, false);
            if(existe)//Verificamos si ya existe un registro con el mismo nombre 
                return "Ya existe una categoria con el mismo nombre.";
            
            const consulta = "INSERT INTO categorias(nombre,color) VALUES (?,?)";
            const parametros = [data.nombre.toUpperCase(), data.color];
            
            await connection.query(consulta, parametros);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Modificar(data:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            let existe = await ValidarExistencia(connection, data, true);
            if(existe)//Verificamos si ya existe un registro con el mismo nombre 
                return "Ya existe una categoria con el mismo nombre.";
            
                const consulta = `UPDATE categorias 
                SET nombre = ?,
                    color = ?
                WHERE id = ? `;

            const parametros = [data.nombre.toUpperCase(), data.color, data.id];
            await connection.query(consulta, parametros);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async Eliminar(id:string): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            await connection.query("DELETE FROM cancion_lista WHERE idLista = ?", [id]);
            await connection.query("DELETE FROM listas WHERE id = ?", [id]);
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    //#endregion
}

async function ObtenerCancionesLista(connection, idLista:number){
    try {
        const consulta =" SELECT c.id, c.nombre, c.tonica, tc.nombre tipoCancion, cl.posicion FROM cancion_lista cl " + 
                        " INNER JOIN canciones c ON cl.idCancion = c.id " +
                        " INNER JOIN tipo_cancion tc ON tc.id = c.idTipoCancion " +
                        " WHERE cl.idLista = ? " +
                        " ORDER BY cl.posicion ASC ";

        const [rows] = await connection.query(consulta, [idLista]);
        const canciones:CancionesLista[] = [];

        if (Array.isArray(rows)) {
            for (let i = 0; i < rows.length; i++) { 
                const row = rows[i];
                
                let cancion:CancionesLista = new CancionesLista({
                    id: row['id'],
                    nombre: row['nombre'],
                    tonica: row['tonica'],
                    tipoCancion: row['tipoCancion'],
                    posicion: row['posicion'],
                });

                canciones.push(cancion);
              }
        }

        return canciones;

    } catch (error) {
        throw error; 
    }
}


async function ValidarExistencia(connection, data:any, modificando:boolean):Promise<boolean>{
    try {
        let consulta = " SELECT id FROM categorias WHERE nombre = ? ";
        if(modificando) consulta += " AND id <> ? ";

        const parametros = [data.nombre.toUpperCase(), data.id];

        const rows = await connection.query(consulta,parametros);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}

export const ListasRepo = new ListasRepository();





