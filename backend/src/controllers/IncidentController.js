const connection = require('../database/connection');

module.exports = {
    async index(req, res) {
        const { page = 1 } = req.query;

        // retornando a quantidade de incidentes cadastrados
        const [count] = await connection('incidents').count();

        res.header('X-Total-Count', count['count(*)']);

        // o limit e offset fazem o esquema de paginacao
        const incidents = await connection('incidents')
            .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
            .limit(5)
            .offset((page - 1) * 5)
            .select([
                'incidents.*', 
                'ongs.name', 
                'ongs.city', 
                'ongs.email', 
                'ongs.whatsapp', 
                'ongs.city', 
                'ongs.uf'
            ]);

        return res.json({ incidents });
    },
    async create(req, res) {
        const { title, description, value } = req.body;

        // toda info de login e autenticaçaõ é passada no headers
        const ong_id = req.headers.authorization;
        const [id] = await connection('incidents').insert({
            title,
            description, 
            value,
            ong_id
        });

        res.json({ id });
    },
    async delete(req, res) {
        const { id } = req.params;

        // necessário verificar se o incidente pertence a ong que o criou
        const ong_id = req.headers.authorization;
        try {            
            const incident = await connection('incidents')
                .where('id', id)
                .select('ong_id')
                .first();
            
            if(incident && (incident.ong_id !== ong_id)) {
                res.status(401).json({ error: 'Operation not permitted.' });
            }

            await connection('incidents').where('id', id).delete();
        }catch(err) {
            console.log(err);
        }
        
        // retornando uma resposta de sucesso sem conteúdo
        return res.status(204).send();
    }
};