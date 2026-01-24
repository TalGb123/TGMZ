import mongoose from 'mongoose';
const { Schema } = mongoose;

const productOptions = { discriminatorKey: 'category', collection: 'products' };

const productSchema = new Schema({
  name: { type: String, required: true, index: true },
  price: { type: Number, default: null },
  image: { type: String },
  inStock: { type: Boolean, default: true },
  color: { type: String, default: null },
}, productOptions);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const CPU = mongoose.models.CPU || Product.discriminator('CPU', new Schema({
  core_count: { type: Number, required: true },
  core_clock: { type: Number, required: true },
  boost_clock: { type: Number, default: null },
  microarchitecture: { type: String },
  tdp: { type: Number },
  graphics: { type: String, default: null } 
}));

const CPUCooler = mongoose.models.CPUCooler || Product.discriminator('CPUCooler', new Schema({
  rpm: { type: Schema.Types.Mixed }, 
  noise_level: { type: Schema.Types.Mixed }, 
  size: { type: Number, default: null }
}));

const Motherboard = mongoose.models.Motherboard || Product.discriminator('Motherboard', new Schema({
  socket: { type: String, required: true },
  form_factor: { type: String, required: true },
  max_memory: { type: Number },
  memory_slots: { type: Number }
}));

const Memory = mongoose.models.Memory || Product.discriminator('Memory', new Schema({
  speed: { type: [Number], required: true },
  modules: { type: [Number], required: true },
  price_per_gb: { type: Number },
  first_word_latency: { type: Number },
  cas_latency: { type: Number }
}));

const Storage = mongoose.models.Storage || Product.discriminator('Storage', new Schema({
  capacity: { type: Number, required: true },
  price_per_gb: { type: Number },
  drive_type: { type: Schema.Types.Mixed, alias: 'type' },
  cache: { type: Number, default: null },
  form_factor: { type: Schema.Types.Mixed },
  interface: { type: String }
}));

const VideoCard = mongoose.models.VideoCard || Product.discriminator('VideoCard', new Schema({
  chipset: { type: String, required: true },
  memory: { type: Number },
  core_clock: { type: Number },
  boost_clock: { type: Number, default: null },
  length: { type: Number }
}));

const Case = mongoose.models.Case || Product.discriminator('Case', new Schema({
  type: { type: String },
  psu: { type: String, default: null },
  side_panel: { type: String },
  external_volume: { type: Number, default: null },
  internal_35_bays: { type: Number }
}));

const PowerSupply = mongoose.models.PowerSupply || Product.discriminator('PowerSupply', new Schema({
  type: { type: String },
  efficiency: { type: String, default: null },
  wattage: { type: Number, required: true },
  modular: { type: Schema.Types.Mixed }
}));

export {
  Product, CPU, CPUCooler, Motherboard, Memory, 
  Storage, VideoCard, Case, PowerSupply
};