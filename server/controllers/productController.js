import prisma from '../config/database.js';

export async function getProducts(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const products = await prisma.product.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { name, description, price, category } = req.body;

    const product = await prisma.product.create({
      data: {
        merchantId,
        name,
        description: description || null,
        price: Number(price),
        category: category || null,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...req.body,
        price: req.body.price ? Number(req.body.price) : undefined,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const merchantId = req.merchant.id;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id, merchantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
