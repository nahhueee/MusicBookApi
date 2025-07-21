import db from '../db/conexion';
import { Acorde } from '../models/Acorde';
import { Cancion } from '../models/Cancion';
import { DetalleCancion } from '../models/DetalleCancion';
import { Seccion } from '../models/Seccion';

class CancionesRepository{

    //#region OBTENER
    async Obtener(filtros:any){
        const connection = await db.getConnection();
        
        try {
            //Obtengo la query segun los filtros
            let queryRegistros = await ObtenerQuery(filtros,false,0);
            let queryTotal = await ObtenerQuery(filtros,true,0);

            //Obtengo la lista de registros y el total
            const rows = await connection.query(queryRegistros);
            const resultado = await connection.query(queryTotal);

            return {total:resultado[0][0].total, registros:rows[0]};

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerCancion(id:any){
        const connection = await db.getConnection();
        
        try {
            let consulta = await ObtenerQuery([],false,id);
            const rows = await connection.query(consulta);

            const row = rows[0][0];
            let cancion:Cancion = new Cancion({
                id: row['id'],
                nombre: row['nombre'],
                tonica: row['tonica'],
                bpm: row['bpm'],
                idTipoCancion:row['idTipoCancion'],
                multitrack:row['multitrack'],
            });
            
            const detallesCancion:DetalleCancion = new DetalleCancion({
                acordes: await ObtenerAcordesCancion(connection, cancion.id),
                secciones: await ObtenerSeccionesCancion(connection, cancion.id),
            });
            
            cancion.etiquetas = await ObtenerEtiquetasCancion(connection, cancion.id)
            cancion.detalles = detallesCancion;

            return cancion;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ValidarExistencia(data:any){
        const connection = await db.getConnection();
        
        try {
            return await ValidarExistencia(connection, data, false);
        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerEtiquetas(){
        const connection = await db.getConnection();
        
        try {
            const [rows] = await connection.query('SELECT etiqueta FROM etiquetas');
            const etiquetas = (rows as { etiqueta: string }[]).map(row => row.etiqueta);
            
            return etiquetas;

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }

    async ObtenerCancionesEtiquetas(etiquetas, idCancion, idTipoCancion){
        const connection = await db.getConnection();
        try {
            let sql = ` SELECT DISTINCT c.id idCancion, c.nombre cancion, c.tonica
                        FROM canciones c
                        INNER JOIN cancion_etiqueta ce ON c.id = ce.idCancion
                        INNER JOIN etiquetas e ON e.id = ce.IdEtiqueta
                        WHERE c.idTipoCancion = ? AND c.id <> ? `

            if(etiquetas.length > 0) sql += `AND e.etiqueta IN (?)`;
            const [canciones]: any[] = await connection.query(sql, [idTipoCancion, idCancion, etiquetas]);
            return [canciones][0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    async ObtenerCancionesTonicaRelativa(nota, idCancion, idTipoCancion){
        const connection = await db.getConnection();
        try {
            const sql = ` SELECT DISTINCT id idCancion, nombre cancion, tonica
                          FROM canciones WHERE tonica = ? AND idTipoCancion = ? AND id <> ?`
                          
            console.log(sql)
                          const [canciones]: any[] = await connection.query(sql, [nota, idTipoCancion, idCancion]);
            return [canciones][0];

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    ObtenerNotaRelativa(tonica:string){
        return ObtenerRelativa(tonica);
    }
    //#endregion
    

    //#region ABM
    async Agregar(cancion:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            //Obtenemos el proximo nro de cancion a insertar
            cancion.id = await ObtenerUltimaCancion(connection);

            //Iniciamos una transaccion
            await connection.beginTransaction();

            //Insertamos la nueva cancion
            await InsertCancion(connection,cancion);

            //Insertamos las etiquetas
            await InsertEtiquetasCancion(connection, cancion.etiquetas, cancion.id);

            //Inserta las secciones de la canción
            for (const seccion of cancion.detalles.secciones) {
                seccion.id = await ObtenerUltimaSeccion(connection);
                seccion.idCancion = cancion.id;

                await InsertSeccion(connection, seccion);

                //Busco los acordes de la seccion
                const acordes = cancion.detalles.acordes.filter(
                    (acorde) => acorde.posSeccion === seccion.posicion
                );
                  
                //Inserta los acordes de la canción
                for (const acordeSeccion of acordes) {
                    acordeSeccion.idCancion = cancion.id;
                    acordeSeccion.idSeccion = seccion.id;
                    await InsertAcordeSeccion(connection, acordeSeccion);
                };
            };

            //Mandamos la transaccion
            await connection.commit();
            return cancion.id;

        } catch (error:any) {
            //Si ocurre un error volvemos todo para atras
            await connection.rollback();
            throw error;
        } finally{
            connection.release();
        }
    }

    async Modificar(cancion:any): Promise<string>{
        const connection = await db.getConnection();
        
        try {

            //Iniciamos una transaccion
            await connection.beginTransaction();

            //Actualizamos los parametros de la cancion
            await UpdateCancion(connection, cancion);

            //Insertamos las etiquetas
            await InsertEtiquetasCancion(connection, cancion.etiquetas, cancion.id);

            await connection.query("DELETE FROM secciones WHERE idCancion = ?", [cancion.id]);
            await connection.query("DELETE FROM acordes WHERE idCancion = ?", [cancion.id]);


            //Inserta las secciones de la canción
            for (const seccion of cancion.detalles.secciones) {
                seccion.id = await ObtenerUltimaSeccion(connection);
                seccion.idCancion = cancion.id;

                await InsertSeccion(connection, seccion);

                //Busco los acordes de la seccion
                const acordes = cancion.detalles.acordes.filter(
                    (acorde) => acorde.posSeccion === seccion.posicion
                );
                  
                //Inserta los acordes de la canción
                for (const acordeSeccion of acordes) {
                    acordeSeccion.idCancion = cancion.id;
                    acordeSeccion.idSeccion = seccion.id;
                    await InsertAcordeSeccion(connection, acordeSeccion);
                };
            };

            //Mandamos la transaccion
            await connection.commit();
            return "OK";

        } catch (error:any) {
            //Si ocurre un error volvemos todo para atras
            await connection.rollback();
            throw error;
        } finally{
            connection.release();
        }
    }

    async Eliminar(id:string): Promise<string>{
        const connection = await db.getConnection();
        
        try {
            //Iniciamos una transaccion
            await connection.beginTransaction();
            await connection.query("DELETE FROM secciones WHERE idCancion = ?", [id]);
            await connection.query("DELETE FROM acordes WHERE idCancion = ?", [id]);
            await connection.query("DELETE FROM cancion_etiqueta WHERE idCancion = ?", [id]);
            await connection.query("DELETE FROM canciones WHERE id = ?", [id]);
            
            return "OK";

        } catch (error:any) {
            throw error;
        } finally{
            connection.release();
        }
    }
    //#endregion
}

async function ObtenerQuery(filtros:any,esTotal:boolean,idCancion:number):Promise<string>{
    try {
        //#region VARIABLES
        let query:string;
        let filtro:string = "";
        let orden:string = "";
        let paginado:string = "";
    
        let count:string = "";
        let endCount:string = "";
        //#endregion

        // #region FILTROS
        if (filtros.busqueda != null && filtros.busqueda != "") 
            filtro += " AND c.nombre LIKE '%"+ filtros.busqueda + "%' ";
        if (filtros.idCategoria != null && filtros.idCategoria != 0) 
            filtro += " AND c.idCategoria = "+ filtros.idCategoria;
        if (filtros.tonica != null && filtros.tonica != "") {
            filtro += " AND (c.tonica = '"+ filtros.tonica + "'"; //Mayores
            filtro += " OR c.tonica = '"+ filtros.tonica + "m'"; //Menores
            const relativa = ObtenerRelativa(filtros.tonica);
            filtro += " OR c.tonica = '"+ relativa + "')"; //Relativa
        }
        if (filtros.idTipoCancion != null && filtros.idTipoCancion != 0) 
            filtro += " AND c.idTipoCancion = "+ filtros.idTipoCancion;
        if (filtros.etiquetas != null && filtros.etiquetas.length > 0) 
            filtro += " AND e.etiqueta IN ("+ filtros.etiquetas.map(e => `'${e}'`).join(',') + ")";
        if (idCancion != null && idCancion != 0) 
            filtro += " AND c.id = "+ idCancion;
        // #endregion

        // #region ORDENAMIENTO
        if (filtros.orden != null && filtros.orden != ""){
            orden += " ORDER BY c."+ filtros.orden + " " + filtros.direccion;
        } else{
            orden += " ORDER BY c.id DESC";
        }           
        // #endregion

        if (esTotal)
        {//Si esTotal agregamos para obtener un total de la consulta
            count = "SELECT COUNT(*) AS total FROM ( ";
            endCount = " ) as subquery";
        }
        else
        {//De lo contrario paginamos
            if (filtros.tamanioPagina != null)
                paginado = " LIMIT " + filtros.tamanioPagina + " OFFSET " + ((filtros.pagina - 1) * filtros.tamanioPagina);
        }
            
        //Arma la Query con el paginado y los filtros correspondientes
        query = count +
                "SELECT DISTINCT c.*, tc.nombre tipoCancion FROM canciones c " +
                " LEFT JOIN cancion_etiqueta ce ON c.id = ce.idCancion " +
                " LEFT JOIN etiquetas e ON ce.idEtiqueta = e.id " +
                " LEFT JOIN tipo_cancion tc ON tc.id = c.idTipoCancion " +
                " WHERE 1 = 1 " +
                filtro +
                orden +
                paginado + 
                endCount;

        return query;
            
    } catch (error) {
        throw error; 
    }
}

async function ValidarExistencia(connection, data:any, modificando:boolean):Promise<boolean>{
    try {
        let consulta = " SELECT id FROM canciones WHERE nombre = ? AND idTipoCancion = ? ";
        if(modificando) consulta += " AND id <> ? ";

        const parametros = [data.nombre.toUpperCase(), data.tipo];

        const rows = await connection.query(consulta,parametros);
        if(rows[0].length > 0) return true;

        return false;
    } catch (error) {
        throw error; 
    }
}

async function ObtenerUltimaCancion(connection):Promise<number>{
    try {
        const rows = await connection.query(" SELECT id FROM canciones ORDER BY id DESC LIMIT 1 ");
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

async function ObtenerUltimaSeccion(connection):Promise<number>{
    try {
        const rows = await connection.query(" SELECT id FROM secciones ORDER BY id DESC LIMIT 1 ");
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
async function InsertCancion(connection, cancion):Promise<void>{
    try {
        const consulta = " INSERT INTO canciones(id,nombre,tonica,bpm,idTipoCancion,multitrack) " +
                         " VALUES(?,?,?,?,?,?) ";

        const parametros = [cancion.id, cancion.nombre, cancion.tonica, cancion.bpm, cancion.idTipoCancion, cancion.multitrack];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}

async function UpdateCancion(connection, cancion):Promise<void>{
    try {
        const consulta = "UPDATE canciones SET nombre = ?, tonica = ?, bpm = ?," +
                         "idTipoCancion = ?, multitrack = ? " +
                         "WHERE id = ?";

        const parametros = [cancion.nombre, cancion.tonica, cancion.bpm, cancion.idTipoCancion, cancion.multitrack, cancion.id];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}

async function InsertSeccion(connection, seccion):Promise<void>{
    try {
        const consulta = " INSERT INTO secciones(id,idCancion,idTipoSeccion,letra,posicion,soloAcorde) " +
                         " VALUES(?,?,?,?,?,?) ";

        const parametros = [seccion.id, seccion.idCancion, seccion.idTipoSeccion, seccion.letra, seccion.posicion, seccion.soloAcorde];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}

async function InsertAcordeSeccion(connection, acordeSeccion):Promise<void>{
    try {
        const consulta = " INSERT INTO acordes(idCancion,idSeccion,acorde,ubicacion,posSeccion) " +
                         " VALUES(?,?,?,?,?) ";

        const parametros = [acordeSeccion.idCancion, acordeSeccion.idSeccion, acordeSeccion.acorde, acordeSeccion.ubicacion, acordeSeccion.posSeccion];
        await connection.query(consulta, parametros);
        
    } catch (error) {
        throw error; 
    }
}

async function InsertEtiquetasCancion(connection, etiquetas:string[], idCancion):Promise<void>{
    try {

        //Eliminamos todas las relaciones para actualizar
        await connection.query("DELETE FROM cancion_etiqueta WHERE idCancion = ?", [idCancion]);

        for (const etiqueta of etiquetas) {
            //Verificar si la etiqueta ya existe
            const [rows]: any = await connection.query("SELECT id FROM etiquetas WHERE etiqueta = ?", [etiqueta.trim().toLowerCase()]);

            let idEtiqueta: number;

            if (rows.length > 0) {
                idEtiqueta = rows[0].id;
            } else {
                // Insertar etiqueta si no existe
                const [insertResult]: any = await connection.query("INSERT INTO etiquetas(etiqueta) VALUES(?)", [etiqueta.trim().toLowerCase()]);
                idEtiqueta = insertResult.insertId;
            }

            //Insertar la relacion
            await connection.query("INSERT INTO cancion_etiqueta(idCancion, idEtiqueta) VALUES(?, ?)", [idCancion, idEtiqueta]);
        }
        
    } catch (error) {
        throw error; 
    }
}

async function ObtenerSeccionesCancion(connection, idCancion:number){
    try {
        const consulta ="SELECT s.*, ts.nombre tipoSeccion FROM secciones s " +
                        "INNER JOIN tipo_seccion ts ON ts.id = s.idTipoSeccion " +
                        "WHERE s.idCancion = ? " +
                        "ORDER BY s.posicion ASC";

        const [rows] = await connection.query(consulta, [idCancion]);

        const secciones:Seccion[] = [];

        if (Array.isArray(rows)) {
            for (let i = 0; i < rows.length; i++) { 
                const row = rows[i];
                
                let seccion:Seccion = new Seccion();
                seccion.id = row['id'];
                seccion.idCancion = row['idCancion'];
                seccion.idTipoSeccion = row['idTipoSeccion'];
                seccion.letra = row['letra'];
                seccion.posicion = row['posicion'];
                seccion.tipoSeccion = row['tipoSeccion'];
                seccion.soloAcorde = row['soloAcorde'];

                secciones.push(seccion)
              }
        }

        return secciones;

    } catch (error) {
        throw error; 
    }
}

async function ObtenerAcordesCancion(connection, idCancion:number){
    try {
        const consulta ="SELECT * FROM acordes WHERE idCancion = ? ";

        const [rows] = await connection.query(consulta, [idCancion]);

        const acordes:Acorde[] = [];

        if (Array.isArray(rows)) {
            for (let i = 0; i < rows.length; i++) { 
                const row = rows[i];
                
                let acorde:Acorde = new Acorde();
                acorde.idSeccion = row['idSeccion'];
                acorde.acorde = row['acorde'];
                acorde.posSeccion = row['posSeccion'];
                acorde.ubicacion = row['ubicacion'];
               
                acordes.push(acorde)
              }
        }

        return acordes;

    } catch (error) {
        throw error; 
    }
}

async function ObtenerEtiquetasCancion(connection, idCancion: number): Promise<string[]> {
    try {
        const [rows]: any = await connection.query(
            `SELECT e.etiqueta 
             FROM etiquetas e
             JOIN cancion_etiqueta ce ON e.id = ce.idEtiqueta
             WHERE ce.idCancion = ?`,
            [idCancion]
        );

        // Devolvemos un array de strings (los nombres de las etiquetas)
        return rows.map((row: any) => row.etiqueta);

    } catch (error) {
        throw error;
    }
}

function ObtenerRelativa(tonica:string){
    const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const match = tonica.match(/^([A-G]#?)(m?)$/i);
    if (!match) return null;

    const nota = match[1].toUpperCase();
    const esMenor = match[2] === 'm';

    const index = NOTAS.indexOf(nota);
    if (index === -1) return null;

    let relativaIndex: number;
    let relativaNota: string;

    if (esMenor) {
        relativaIndex = (index + 3) % 12;
        relativaNota = NOTAS[relativaIndex]; // Relativa mayor
    } else {
        relativaIndex = (index + 9) % 12; // (index - 3 + 12) % 12
        relativaNota = NOTAS[relativaIndex] + 'm'; // Relativa menor
    }

    return relativaNota;
}


export const CancionesRepo = new CancionesRepository();





