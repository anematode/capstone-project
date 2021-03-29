import {TilesetLoader} from "./tileset"

const filenames = `
acacia_door_bottom
acacia_door_top
acacia_leaves
acacia_log
acacia_log_top
acacia_planks
acacia_sapling
acacia_trapdoor
activator_rail
activator_rail_on
allium
andesite
anvil
anvil_top
attached_melon_stem
attached_pumpkin_stem
azure_bluet
bamboo_large_leaves
bamboo_singleleaf
bamboo_small_leaves
bamboo_stage0
bamboo_stalk
beacon
bedrock
beetroots_stage0
beetroots_stage1
beetroots_stage2
beetroots_stage3
birch_door_bottom
birch_door_top
birch_leaves
birch_log
birch_log_top
birch_planks
birch_sapling
birch_trapdoor
black_concrete
black_concrete_powder
black_glazed_terracotta
black_shulker_box
black_stained_glass
black_stained_glass_pane_top
black_terracotta
black_wool
blue_concrete
blue_concrete_powder
blue_glazed_terracotta
blue_ice
blue_orchid
blue_shulker_box
blue_stained_glass
blue_stained_glass_pane_top
blue_terracotta
blue_wool
bone_block_side
bone_block_top
bookshelf
brain_coral
brain_coral_block
brain_coral_fan
brewing_stand
brewing_stand_base
bricks
brown_concrete
brown_concrete_powder
brown_glazed_terracotta
brown_mushroom
brown_mushroom_block
brown_shulker_box
brown_stained_glass
brown_stained_glass_pane_top
brown_terracotta
brown_wool
bubble_coral
bubble_coral_block
bubble_coral_fan
cactus_bottom
cactus_side
cactus_top
cake_bottom
cake_inner
cake_side
cake_top
carrots_stage0
carrots_stage1
carrots_stage2
carrots_stage3
carved_pumpkin
cauldron_bottom
cauldron_inner
cauldron_side
cauldron_top
chain_command_block_back
chain_command_block_back
chain_command_block_conditional
chain_command_block_conditional
chain_command_block_front
chain_command_block_front
chain_command_block_side
chain_command_block_side
chipped_anvil_top
chiseled_quartz_block
chiseled_quartz_block_top
chiseled_red_sandstone
chiseled_sandstone
chiseled_stone_bricks
chorus_flower
chorus_flower_dead
chorus_plant
clay
coal_block
coal_ore
coarse_dirt
cobblestone
cobweb
cocoa_stage0
cocoa_stage1
cocoa_stage2
command_block_back
command_block_back
command_block_conditional
command_block_conditional
command_block_front
command_block_front
command_block_side
command_block_side
comparator
comparator_on
conduit
cornflower
cracked_stone_bricks
crafting_table_front
crafting_table_side
crafting_table_top
crying_obsidian
cut_red_sandstone
cut_sandstone
cyan_concrete
cyan_concrete_powder
cyan_glazed_terracotta
cyan_shulker_box
cyan_stained_glass
cyan_stained_glass_pane_top
cyan_terracotta
cyan_wool
damaged_anvil_top
dandelion
dark_oak_door_bottom
dark_oak_door_top
dark_oak_leaves
dark_oak_log
dark_oak_log_top
dark_oak_planks
dark_oak_sapling
dark_oak_trapdoor
dark_prismarine
daylight_detector_inverted_top
daylight_detector_side
daylight_detector_top
dead_brain_coral
dead_brain_coral_block
dead_brain_coral_fan
dead_bubble_coral
dead_bubble_coral_block
dead_bubble_coral_fan
dead_bush
dead_fire_coral
dead_fire_coral_block
dead_fire_coral_fan
dead_horn_coral
dead_horn_coral_block
dead_horn_coral_fan
dead_tube_coral
dead_tube_coral_block
dead_tube_coral_fan
debug
debug2
destroy_stage_0
destroy_stage_1
destroy_stage_2
destroy_stage_3
destroy_stage_4
destroy_stage_5
destroy_stage_6
destroy_stage_7
destroy_stage_8
destroy_stage_9
detector_rail
detector_rail_on
diamond_block
diamond_ore
diorite
dirt
dispenser_front
dispenser_front_vertical
dragon_egg
dried_kelp_bottom
dried_kelp_side
dried_kelp_top
dropper_front
dropper_front_vertical
emerald_block
emerald_ore
enchanting_table_bottom
enchanting_table_side
enchanting_table_top
end_portal_frame_eye
end_portal_frame_side
end_portal_frame_top
end_rod
end_stone
end_stone_bricks
farmland
farmland_moist
fern
fire_0
fire_0
fire_1
fire_1
fire_coral
fire_coral_block
fire_coral_fan
flower_pot
frosted_ice_0
frosted_ice_1
frosted_ice_2
frosted_ice_3
furnace_front
furnace_front_on
furnace_side
furnace_top
glass
glass_pane_top
glowstone
gold_block
gold_ore
granite
grass
grass_block_side
grass_block_side_overlay
grass_block_snow
grass_block_top
grass_path_side
grass_path_top
gravel
gray_concrete
gray_concrete_powder
gray_glazed_terracotta
gray_shulker_box
gray_stained_glass
gray_stained_glass_pane_top
gray_terracotta
gray_wool
green_concrete
green_concrete_powder
green_glazed_terracotta
green_shulker_box
green_stained_glass
green_stained_glass_pane_top
green_terracotta
green_wool
hay_block_side
hay_block_top
hopper_inside
hopper_outside
hopper_top
horn_coral
horn_coral_block
horn_coral_fan
ice
iron_bars
iron_block
iron_door_bottom
iron_door_top
iron_ore
iron_trapdoor
item_frame
jack_o_lantern
jukebox_side
jukebox_top
jungle_door_bottom
jungle_door_top
jungle_leaves
jungle_log
jungle_log_top
jungle_planks
jungle_sapling
jungle_trapdoor
kelp
kelp
kelp_plant
kelp_plant
ladder
lapis_block
lapis_ore
large_fern_bottom
large_fern_top
lava_flow
lava_flow
lava_still
lava_still
lever
light_blue_concrete
light_blue_concrete_powder
light_blue_glazed_terracotta
light_blue_shulker_box
light_blue_stained_glass
light_blue_stained_glass_pane_top
light_blue_terracotta
light_blue_wool
light_gray_concrete
light_gray_concrete_powder
light_gray_glazed_terracotta
light_gray_shulker_box
light_gray_stained_glass
light_gray_stained_glass_pane_top
light_gray_terracotta
light_gray_wool
lilac_bottom
lilac_top
lily_of_the_valley
lily_pad
lime_concrete
lime_concrete_powder
lime_glazed_terracotta
lime_shulker_box
lime_stained_glass
lime_stained_glass_pane_top
lime_terracotta
lime_wool
magenta_concrete
magenta_concrete_powder
magenta_glazed_terracotta
magenta_shulker_box
magenta_stained_glass
magenta_stained_glass_pane_top
magenta_terracotta
magenta_wool
magma
magma
melon_side
melon_stem
melon_top
mossy_cobblestone
mossy_stone_bricks
mushroom_block_inside
mushroom_stem
mycelium_side
mycelium_top
nether_bricks
nether_portal
nether_portal
nether_quartz_ore
nether_wart_block
nether_wart_stage0
nether_wart_stage1
nether_wart_stage2
netherrack
note_block
oak_door_bottom
oak_door_top
oak_leaves
oak_log
oak_log_top
oak_planks
oak_sapling
oak_trapdoor
observer_back
observer_back_on
observer_front
observer_side
observer_top
obsidian
orange_concrete
orange_concrete_powder
orange_glazed_terracotta
orange_shulker_box
orange_stained_glass
orange_stained_glass_pane_top
orange_terracotta
orange_tulip
orange_wool
oxeye_daisy
packed_ice
peony_bottom
peony_top
pink_concrete
pink_concrete_powder
pink_glazed_terracotta
pink_shulker_box
pink_stained_glass
pink_stained_glass_pane_top
pink_terracotta
pink_tulip
pink_wool
piston_bottom
piston_inner
piston_side
piston_top
piston_top_sticky
podzol_side
podzol_top
polished_andesite
polished_diorite
polished_granite
poppy
potatoes_stage0
potatoes_stage1
potatoes_stage2
potatoes_stage3
powered_rail
powered_rail_on
prismarine
prismarine
prismarine_bricks
pumpkin_side
pumpkin_stem
pumpkin_top
purple_concrete
purple_concrete_powder
purple_glazed_terracotta
purple_shulker_box
purple_stained_glass
purple_stained_glass_pane_top
purple_terracotta
purple_wool
purpur_block
purpur_pillar
purpur_pillar_top
quartz_block_bottom
quartz_block_side
quartz_block_top
quartz_pillar
quartz_pillar_top
rail
rail_corner
red_concrete
red_concrete_powder
red_glazed_terracotta
red_mushroom
red_mushroom_block
red_nether_bricks
red_sand
red_sandstone
red_sandstone_bottom
red_sandstone_top
red_shulker_box
red_stained_glass
red_stained_glass_pane_top
red_terracotta
red_tulip
red_wool
redstone_block
redstone_dust_dot
redstone_dust_line0
redstone_dust_line1
redstone_dust_overlay
redstone_lamp
redstone_lamp_on
redstone_ore
redstone_torch
redstone_torch_off
repeater
repeater_on
repeating_command_block_back
repeating_command_block_back
repeating_command_block_conditional
repeating_command_block_conditional
repeating_command_block_front
repeating_command_block_front
repeating_command_block_side
repeating_command_block_side
rose_bush_bottom
rose_bush_top
sand
sandstone
sandstone_bottom
sandstone_top
sea_lantern
sea_lantern
sea_pickle
seagrass
seagrass
shulker_box
slime_block
smooth_stone
smooth_stone_slab_side
snow
soul_sand
spawner
sponge
spruce_door_bottom
spruce_door_top
spruce_leaves
spruce_log
spruce_log_top
spruce_planks
spruce_sapling
spruce_trapdoor
stone
stone_bricks
stripped_acacia_log
stripped_acacia_log_top
stripped_birch_log
stripped_birch_log_top
stripped_dark_oak_log
stripped_dark_oak_log_top
stripped_jungle_log
stripped_jungle_log_top
stripped_oak_log
stripped_oak_log_top
stripped_spruce_log
stripped_spruce_log_top
structure_block
structure_block_corner
structure_block_data
structure_block_load
structure_block_save
sugar_cane
sunflower_back
sunflower_bottom
sunflower_front
sunflower_top
tall_grass_bottom
tall_grass_top
tall_seagrass_bottom
tall_seagrass_bottom
tall_seagrass_top
tall_seagrass_top
terracotta
tnt_bottom
tnt_side
tnt_top
torch
tripwire
tripwire_hook
tube_coral
tube_coral_block
tube_coral_fan
turtle_egg
turtle_egg_slightly_cracked
turtle_egg_very_cracked
vine
water_flow
water_flow
water_overlay
water_still
water_still
wet_sponge
wheat_stage0
wheat_stage1
wheat_stage2
wheat_stage3
wheat_stage4
wheat_stage5
wheat_stage6
wheat_stage7
white_concrete
white_concrete_powder
white_glazed_terracotta
white_shulker_box
white_stained_glass
white_stained_glass_pane_top
white_terracotta
white_tulip
white_wool
wither_rose
yellow_concrete
yellow_concrete_powder
yellow_glazed_terracotta
yellow_shulker_box
yellow_stained_glass
yellow_stained_glass_pane_top
yellow_terracotta
yellow_wool`.split('\n')

export const mainTileset = new TilesetLoader()

for (const a of filenames.slice(0, 100)) {
  if (a)
    mainTileset.addTile(a)
}

window.mainTileset = mainTileset