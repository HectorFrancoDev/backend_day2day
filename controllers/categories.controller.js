const { response, request } = require('express');

const Category = require('../models/categories.model');

const createCategory = async (req, res = response) => { };

const getCategories = async (req, res = response) => { };

const createCategoriesScript = async (req, res = response) => {

    const { data } = req.body;

    const usedCategory = [];

    if (!data)
        return res.status(400).json({ error: 'Falta el valor "data"' });

    if (data.length === 0)
        return res.status(400).json({ error: 'Lista vacia de categorias' });

    for (let i = 0; i < data.length; i++) {

        const { code = 1, name = '' } = data[i];

        const verifyCategory = await Category.findOne({ code });

        if (verifyCategory) {

            usedCategory.push(verifyCategory);
            continue;
        }

        const category = new Category({ code, name });

        await category.save();
    }

    res.status(200).json({
        msg: "Categorias cargadas con éxito"
    });
};

module.exports = {
    createCategory,
    getCategories,
    createCategoriesScript
}
