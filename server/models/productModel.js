import mongoose from 'mongoose';
const { Schema } = mongoose;

const productOptions = { discriminatorKey: 'category', collection: 'products' };

const productSchema = new Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number, default: 999999 },
  brand: { type: String, required: true },
  image: { type: String },
  inStock: { type: Boolean, default: true },
}, productOptions);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const CPU = mongoose.models.CPU || Product.discriminator('CPU', new Schema({
  socket: { type: String, required: true },
  core_count: { type: Number, required: true },
  core_clock: { type: Number, required: true },
  boost_clock: { type: Number, default: null },
  tdp: { type: Number, required: true },
  has_apu: { type: Boolean, default: false },
  supported_memory: { type: [String], required: true }
}));

const CPUCooler = mongoose.models.CPUCooler || Product.discriminator('CPUCooler', new Schema({
  type: { type: String, required: true },
  supported_sockets: { type: [String], required: true },
  height: { type: Number }, 
  radiator_size: { type: Number, default: 0 }, 
  noise_level: { type: Number },
  max_tdp_cooling: { type: Number, required: true },
  color: { type: String }
}));

const Motherboard = mongoose.models.Motherboard || Product.discriminator('Motherboard', new Schema({
  socket: { type: String, required: true },
  form_factor: { type: String, required: true },
  memory_gen: { type: String, required: true }, 
  memory_slots: { type: Number, required: true },
  has_wifi_bluetooth: { type: Boolean, default: false },
  m2_slots: { type: Number },
  connections: { type: [String] },
  color: { type: String },
  vrm_tier: { type: Number, required: true, min: 1, max: 5 },
}));

const Memory = mongoose.models.Memory || Product.discriminator('Memory', new Schema({
  // e.g. ["DDR5", 5200, 40] -> gen, speed, CL
  speed: { type: [Schema.Types.Mixed], required: true }, 
  // e.g. "2X32" -> stick_amount, capacity_per_stick
  modules: { type: String, required: true },
  color: { type: String }
}));

const Storage = mongoose.models.Storage || Product.discriminator('Storage', new Schema({
  capacity: { type: Number, required: true },
  drive_type: { type: String, alias: 'type', required: true },
  form_factor: { type: String, required: true }
}));

const VideoCard = mongoose.models.VideoCard || Product.discriminator('VideoCard', new Schema({
  chipset: { type: String, required: true },
  memory: { type: Number, required: true },
  core_clock: { type: Number },
  boost_clock: { type: Number, default: null },
  tdp: { type: Number, required: true },
  length: { type: Number, required: true },
  slots_required: { type: Number, required: true },
  recommended_psu_wattage: { type: Number, required: true },
  color: { type: String }
}));

const Case = mongoose.models.Case || Product.discriminator('Case', new Schema({
  type: { type: String, required: true },
  max_gpu_length: { type: Number, required: true },
  max_cpu_cooler_height: { type: Number, required: true },
  psu_form_factor: { type: String, required: true },
  supported_radiators: { type: [Number] },
  sidepanel_material: { type: String },
  color: { type: String }
}));

const PowerSupply = mongoose.models.PowerSupply || Product.discriminator('PowerSupply', new Schema({
  type: { type: String, required: true },
  efficiency: { type: String, default: null },
  wattage: { type: Number, required: true },
  modular: { type: String, required: true },
  color: { type: String }
}));

export {
  Product, CPU, CPUCooler, Motherboard, Memory, 
  Storage, VideoCard, Case, PowerSupply
};