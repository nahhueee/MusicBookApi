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
    async Agregar(lista:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {

            let existe = await ValidarExistencia(connection, lista, false);
            if(existe)//Verificamos si ya existe un registro con el mismo nombre 
                return "Ya existe una lista con el mismo nombre.";

            //Obtenemos el proximo nro de lista a insertar
            lista.id = await ObtenerUltimaLista(connection);
            
            await connection.beginTransaction();

            await InsertLista(connection, lista);

            //Eliminamos todo antes de insertar
            await connection.query("DELETE FROM cancion_lista WHERE idLista = ?", [lista.id]);

            //Inserta las canciones de la lista
            if(lista.canciones && lista.canciones!.length > 0){
                for (const cancion of lista.canciones!) {
                    cancion.idLista = lista.id;
                    await InsertCancionLista(connection, cancion);
                };
            }
          

            await connection.commit();
            return lista.id;

        } catch (error:any) {
            //Si ocurre un error volvemos todo para atras
            await connection.rollback();
            throw error;
        } finally{
            connection.release();
        }
    }

    async Modificar(lista:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            let existe = await ValidarExistencia(connection, lista, true);
            if(existe)//Verificamos si ya existe un registro con el mismo nombre 
                return "Ya existe una lista con el mismo nombre.";
            
            await connection.beginTransaction();

            await UpdateLista(connection, lista);
            
            //Eliminamos todo antes de insertar
            await connection.query("DELETE FROM cancion_lista WHERE idLista = ?", [lista.id]);

            //Inserta las canciones de la lista
            if(lista.canciones && lista.canciones!.length > 0){
                for (const cancion of lista.canciones!) {
                    cancion.idLista = lista.id;
                    await InsertCancionLista(connection, cancion);
                };
            }

            await connection.commit();
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

    async InsertCancion(data:any){
        const connection = await db.getConnection();

        try {
            let existe = await ValidarExistenciaCancionLista(connection, data);
            if(existe)//Verificamos si ya existe un registro con el mismo nombre 
                return "Ya existe la canción en la lista.";

            //Obtenemos la última posición
            const [result]: any = await connection.query(
                "SELECT posicion FROM cancion_lista WHERE idLista = ? ORDER BY posicion DESC LIMIT 1",
                [data.idLista]
            );

            const ultimaPosicion = result[0]?.posicion ?? 0;

            data.posicion = ultimaPosicion + 1;
            InsertCancionLista(connection, data)

            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async DeleteCancion(data:any){
        const connection = await db.getConnection();

        try {
            await connection.query("DELETE FROM cancion_lista WHERE idCancion = ? AND idLista = ?", [data.idCancion, data.idLista]);
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
                    idCancion: row['id'],
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


async function UpdateLista(connection, lista):Promise<void>{
    try {
        const consulta = " UPDATE listas SET nombre = ?, color = ?" +
                         " WHERE id = ? ";

        const parametros = [lista.nombre, lista.color, lista.id];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}
async function InsertLista(connection, lista):Promise<void>{
    try {
        const consulta = " INSERT INTO listas(nombre,color) " +
                         " VALUES(?,?) ";

        const parametros = [lista.nombre, lista.color];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}
async function InsertCancionLista(connection, cancionLista):Promise<void>{
    try {
        const consulta = " INSERT INTO cancion_lista(idLista,idcancion,posicion) " +
                         " VALUES(?,?,?) ";

        const parametros = [cancionLista.idLista, cancionLista.idCancion, cancionLista.posicion];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}
async function ObtenerUltimaLista(connection):Promise<number>{
    try {
        const rows = await connection.query(" SELECT id FROM listas ORDER BY id DESC LIMIT 1 ");
        let resultado:number = 0;

        if([rows][0][0].length==0){
            resultado = 1;
        }else{
            resultado = rows[0][0].id + 1;
        }

        return resultado;
        
    } catch (error) {
        throw error; 
    }
}
async function ValidarExistencia(connection, data:any, modificando:boolean):Promise<boolean>{
    try {
        let consulta = " SELECT id FROM listas WHERE nombre = ? ";
        if(modificando) consulta += " AND id <> ? ";

        const parametros = [data.nombre.toUpperCase(), data.id];

        const rows = await connection.query(consulta,parametros);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}
async function ValidarExistenciaCancionLista(connection, data:any):Promise<boolean>{
    try {
        let consulta = " SELECT idCancion FROM cancion_lista WHERE idCancion = ? AND idLista = ? ";

        const parametros = [data.idCancion, data.idLista];
        const rows = await connection.query(consulta,parametros);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}

export const ListasRepo = new ListasRepository();





