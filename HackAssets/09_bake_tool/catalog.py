import json

NOTES = ["P:note#y on", "P:note#b on", "P:note#p on"]
ROOM_ORDER = ["science", "maths", "history", "geography", "english"]
TIERS = {1: {"name": "Cottage", "grade": 4, "n": 6, "slab": "#8fd0dc"}, 2: {"name": "Big House", "grade": 5, "n": 7, "slab": "#a7b8e6"}}


def it(id, name, slot, stages, addons):
    return {"id": id, "name": name, "slot": slot, "stages": stages, "addons": addons}


def same(part, extra=None):
    return [[part] + (extra[i] if extra else []) for i in range(4)]


def win(side, a):
    return "P:window @%s y1.25 r%d" % (("%s,0.02" % a) if side == "R" else ("0.02,%s" % a), 0 if side == "R" else 90)


ROOMS = {1: {}, 2: {}}

ROOMS[1]["science"] = {"name": "Lab", "wallL": "#dff0d8", "wallR": "#cfe8c6", "floor": "#d9a46a",
    "decor": [win("R", 5.6), "KF:rug_oval_A @4.2,4.4 w3.4", "F:pottedPlant @7.45,0.5 h1.3", "KF:cactus_medium_A @0.5,7.45 h0.8"],
    "items": [
    it("lab_bench", "Lab bench", "r1",
       [["KR:kitchentable_A h0.85"],
        ["KR:kitchentable_sink h0.85", "KD:bottle_A_green on h0.3"],
        ["KR:kitchencounter_sink_backsplash h0.95", "KD:bottle_C_green on h0.3", "P:microscope on"],
        ["KR:kitchentable_sink_large_decorated h0.95", "P:microscope on s1.2", "KD:bottle_A_labeled_green on h0.32", "KR:extractorhood top h0.6"]],
       ["KD:bottle_B_brown on h0.25", "KR:jar_A_small on h0.22", "F:trashcan L h0.45"]),
    it("grow_shelf", "Grow shelf", "r2",
       [["KF:cactus_small_A h0.45"],
        ["F:sideTable h0.6", "KF:cactus_small_B on h0.35", "F:plantSmall1 on h0.3"],
        ["F:bookcaseOpenLow h0.9", "F:plantSmall1 on h0.3", "F:plantSmall2 on h0.32", "F:plantSmall3 on h0.32"],
        ["F:bookcaseOpenLow h1.0", "KF:cactus_medium_A on h0.45", "F:plantSmall3 on h0.35", "F:lampSquareTable on h0.4", "F:pottedPlant R h1.2"]],
       ["NA:flower_yellowA F x-0.4 h0.25", "KF:cactus_small_B on h0.3", "NA:flower_redA F x0.4 h0.25"]),
    it("space_corner", "Space corner", "l1",
       [["F:sideTable h0.6", "SP:meteorHalf on h0.2"],
        ["F:sideTableDrawers h0.7", "SP:spaceCraft1 on w0.5", "SP:satelliteDish R h0.6"],
        ["KS:landingpad_small w1.1", "SP:spaceCraft3 on w0.8", "SP:satelliteDish R h0.8"],
        ["KS:landingpad_large w1.5", "SP:spaceCraft5 on w1.0", "SP:satelliteDishLarge R h1.1", "SP:astronaut L h0.6"]],
       ["SP:rocksSmallOre F x0.4 h0.15", "SP:barrel F x-0.4 h0.25", "SP:pipeStand F h0.4"]),
    it("robot_desk", "Robot desk", "l2",
       [["F:table h0.75", "SP:robot on h0.3"],
        ["F:desk h0.8", "SP:robot on h0.35", "F:computerKeyboard on h0.05"],
        ["F:desk h0.8", "F:computerScreen on h0.45", "SP:robot on h0.4", "F:chairDesk F h1.0"],
        ["F:desk h0.85", "F:computerScreen on h0.45", "F:laptop on h0.15", "SP:robot on h0.45", "F:chairDesk F h1.0", "SP:astronaut R h0.6"]],
       ["F:computerMouse on h0.04", "F:lampSquareTable on h0.4", "F:speakerSmall L h0.35"]),
    it("rock_table", "Rock collection", "c",
       [["NA:rock_smallA h0.25"],
        ["F:tableCoffee h0.45", "SP:rocksOre on h0.25"],
        ["F:tableCoffeeSquare h0.45", "SP:rocksOre on h0.25", "NA:stone_tallA on h0.35"],
        ["F:tableCoffeeGlass h0.45", "SP:rocksTallOre on h0.35", "SP:meteorHalf on h0.25", "NA:rock_tallA R h0.6"]],
       ["NA:rock_smallB L h0.15", "NA:stone_smallA F h0.15", "NA:mushroom_tanGroup F x0.5 h0.15"]),
    it("atom_poster", "Atom poster", "wl", same("P:poster#atom"), NOTES),
]}

ROOMS[1]["maths"] = {"name": "Maths workshop", "wallL": "#dbe8f5", "wallR": "#c9dcef", "floor": "#cfa06e",
    "decor": [win("L", 6.0), "KF:rug_rectangle_stripes_B @4.3,4.5 w3.4 r45", "F:pottedPlant @0.5,7.45 h1.3", "KF:cactus_medium_B @7.45,0.5 h0.8"],
    "items": [
    it("chalkboard", "Chalkboard", "wr", same("P:chalkboard"), NOTES),
    it("shape_blocks", "Shape blocks", "c",
       [["KP:Primitive_Cube_Small h0.3"],
        ["KP:Primitive_Cube h0.45", "KP:Primitive_Slope R h0.4"],
        ["F:tableCoffeeSquare h0.45", "KP:Primitive_Cube_Small on h0.2", "KP:Primitive_Pillar on h0.4", "KP:Primitive_Slope_OuterCorner on h0.25"],
        ["KF:table_medium h0.6", "KP:Primitive_Stairs on h0.3", "KP:Primitive_Pillar on h0.45", "KP:Primitive_Slope_OuterCorner on h0.3", "KP:Primitive_Window R h0.6", "KP:Primitive_Cube L h0.4"]],
       ["KP:Primitive_Cube_Small F h0.15", "KP:Primitive_Slope_Half F x0.4 h0.15", "KP:Primitive_Beam F x-0.4 h0.1"]),
    it("maths_desk", "Maths desk", "r2",
       [["KF:table_small h0.7", "KF:chair_A F h0.9"],
        ["KF:table_medium h0.75", "KF:chair_B F h0.95", "P:calculator on"],
        ["F:desk h0.8", "F:chairDesk F h1.0", "F:computerScreen on h0.45", "P:calculator on"],
        ["F:desk h0.85", "F:chairDesk F h1.0", "F:computerScreen on h0.45", "F:computerScreen on h0.45", "F:lampSquareTable on h0.4"]],
       ["KF:book_set on h0.25", "KF:book_single on h0.2", "F:trashcan R h0.45"]),
    it("wall_clock", "Wall clock", "wl", same("P:clock"), NOTES),
    it("maths_books", "Maths books", "l1",
       [["F:bookcaseOpenLow h0.9"], ["F:bookcaseOpenLow h0.95", "KF:book_set on h0.25"],
        ["F:bookcaseOpen h1.9", "KF:book_set on h0.25"], ["F:bookcaseClosedWide h2.0", "KF:book_set on h0.25", "F:books on h0.2"]],
       ["KF:cactus_small_A on h0.3", "KF:book_single F h0.15", "F:lampSquareFloor R h1.4"]),
    it("trophy_shelf", "Trophy shelf", "l2",
       [["F:sideTable h0.6", "KD:coin_stack_small on h0.12"],
        ["F:sideTable h0.65", "KD:coin_stack_medium on h0.18", "KD:coin_stack_small on h0.12"],
        ["KF:cabinet_medium h0.75", "KD:coin_stack_large on h0.25", "KD:chest_gold on h0.25"],
        ["F:bookcaseOpenLow h1.0", "KD:chest_gold on h0.3", "KD:coin_stack_large on h0.3", "KD:sword_shield_gold on h0.4"]],
       ["KD:coin_stack_small F h0.1", "KD:candle_triple on h0.25", "KF:cactus_small_B L h0.35"]),
]}

ROOMS[1]["history"] = {"name": "Museum", "wallL": "#f3e2c2", "wallR": "#ead3a8", "floor": "#b9875a",
    "decor": ["KF:rug_rectangle_A @4.3,4.6 w3.6 r45", "KH:lantern_standing @7.45,0.5 h0.9", "F:pottedPlant @0.5,7.45 h1.3"],
    "items": [
    it("pottery_shelf", "Pottery shelf", "r1",
       [["GV:urn h0.45"], ["F:sideTable h0.6", "GV:urn on h0.35", "KR:jar_C_small on h0.2"],
        ["KF:cabinet_medium h0.75", "GV:urn on h0.4", "KR:jar_C_large on h0.3", "KR:jar_D_medium on h0.25"],
        ["F:bookcaseOpenLow h1.0", "GV:urn on h0.45", "KR:jar_D_large on h0.35", "KR:jar_C_large on h0.35", "GV:urn R h0.6"]],
       ["GV:lanternCandle L h0.35", "KR:jar_C_small on h0.18", "GV:detailChalice on h0.15"]),
    it("egypt_corner", "Egypt corner", "l1",
       [["GV:urn h0.4"], ["GV:pillarObelisk h1.2"], ["GV:pillarObelisk h1.4", "GV:altarStone R h0.5", "GV:urn L h0.4"],
        ["NA:statue_obelisk h1.8", "GV:pillarObelisk L h1.4", "GV:altarStone R h0.55", "KD:coin_stack_medium F h0.15"]],
       ["NA:cactus_short F x0.45 h0.4", "GV:lanternCandle F x-0.45 h0.35", "GV:detailBowl F h0.1"]),
    it("greek_statues", "Greek statues", "l2",
       [["NA:statue_block h0.6"], ["NA:statue_column h1.2"], ["NA:statue_ring h1.3", "NA:statue_column L h1.2"],
        ["NA:statue_head h1.6", "GV:columnLarge L h1.8", "GV:columnLarge R h1.8"]],
       ["GV:urn F x0.45 h0.35", "NA:flower_yellowA F x-0.45 h0.2", "GV:lanternCandle F h0.3"]),
    it("roman_siege", "Roman siege model", "c",
       [["CA:siegeRam w0.7"], ["CA:siegeBallista w0.9"], ["CA:siegeCatapult w1.4"], ["CA:siegeTrebuchet w1.7", "CA:knightRed L h0.7"]],
       ["KD:barrel_small F x0.5 h0.25", "KD:box_small F x-0.5 h0.25", "CA:shieldRed F h0.25"]),
    it("treasure_chest", "Treasure chest", "r2",
       [["KD:box_small h0.35"], ["KD:trunk_medium_A h0.45"], ["KD:trunk_large_A h0.55"],
        ["KD:chest_gold h0.5", "KD:coin_stack_large L h0.25", "KD:coin_stack_medium R h0.2"]],
       ["KD:coin_stack_small F h0.1", "KD:candle_triple F x0.55 h0.25", "KD:key F x-0.5 h0.08"]),
    it("timeline", "Timeline wall", "wr", same("P:timeline"), ["P:note#y on", "CA:sword R h0.5", "CA:shieldBlue L h0.4"]),
]}

ROOMS[1]["geography"] = {"name": "Explorer's den", "wallL": "#f6e7cf", "wallR": "#efdcbc", "floor": "#c99a63",
    "decor": [win("L", 6.0), "KF:rug_oval_B @4.3,4.5 w3.4 r45", "F:pottedPlant @7.45,0.5 h1.3"],
    "items": [
    it("world_map", "World map", "wr", same("P:poster#map"), NOTES),
    it("globe", "Globe", "r2",
       [["F:sideTable h0.6", "P:globe on"], ["F:sideTable h0.6", "P:globe on"], ["KF:table_small h0.7", "P:globe on", "KF:book_set on h0.2"],
        ["P:globe s2.2", "KF:book_set L h0.25"]],
       ["KF:book_single F x0.3 h0.15", "KF:cactus_small_A F x-0.35 h0.3", "NA:flower_purpleA F h0.2"]),
    it("landscape_table", "Landscape model", "c",
       [["F:tableCoffeeSquare h0.45", "HX:sand on w0.4"], ["KF:table_medium h0.6", "HX:grass_hill on w0.45", "HX:water on w0.45"],
        ["KF:table_medium_long h0.6", "HX:river_straight on w0.45", "HX:grass_forest on w0.45", "HX:water_island on w0.45"],
        ["KF:table_medium_long h0.7", "HX:stone_mountain on w0.5", "HX:river_straight on w0.45", "HX:building_village on w0.45", "HX:grass_forest on w0.45"]],
       ["HX:unit_tree F x0.4 h0.25", "HX:unit_boat F h0.15", "HX:unit_house F x-0.4 h0.2"]),
    it("telescope", "Telescope", "l1", same("P:telescope", [[], [], ["KF:book_set R h0.25"], ["KF:book_set R h0.25", "KH:lantern_standing L h0.5"]]),
       ["KF:book_single F x0.3 h0.15", "NA:rock_smallA F x-0.3 h0.15", "P:note#b F h0.01"]),
    it("weather_station", "Weather station", "l2", same("P:weather", [[], [], ["KS:solarpanel R h0.5"], ["KS:solarpanel R h0.55", "NA:flower_yellowA L h0.3"]]),
       ["NA:flower_redA F x0.3 h0.2", "NA:grass F x-0.3 h0.2", "NA:rock_smallC F h0.15"]),
    it("explorer_camp", "Explorer camp", "r1",
       [["NA:log_stack h0.3"], ["NA:tent_smallOpen h0.9"], ["NA:tent_smallOpen h1.0", "NA:campfire_stones R h0.25"],
        ["NA:tent_detailedOpen h1.2", "NA:campfire_logs R h0.35", "NA:canoe L w1.0"]],
       ["NA:log F x0.4 h0.12", "NA:mushroom_redGroup F x-0.4 h0.15", "KH:lantern_standing F h0.4"]),
]}

ROOMS[1]["english"] = {"name": "Reading nook", "wallL": "#f4dfe4", "wallR": "#ecd0d8", "floor": "#d4a274",
    "decor": [win("R", 6.0), "KF:rug_oval_A @4.3,4.5 w3.4", "F:pottedPlant @0.5,7.45 h1.3"],
    "items": [
    it("bookshelf", "Big bookshelf", "r1",
       [["F:bookcaseOpenLow h0.9"], ["F:bookcaseOpenLow h0.95", "KF:book_set on h0.25"], ["F:bookcaseOpen h1.9", "F:books on h0.2"],
        ["F:bookcaseOpen h1.9", "F:bookcaseOpen R h1.9", "KF:book_set on h0.25"]],
       ["KF:cactus_small_A on h0.3", "KF:book_single F h0.15", "F:lampRoundTable on h0.35"]),
    it("reading_chair", "Reading chair", "c",
       [["KF:chair_A_wood h0.9"], ["KF:chair_C h0.95"], ["KF:armchair_pillows h0.9"], ["KF:armchair_pillows h0.95", "KF:lamp_standing R h1.6"]],
       ["KF:pillow_B L h0.2", "KF:book_set F h0.2", "KF:cactus_small_B F x0.6 h0.3"]),
    it("writing_desk", "Writing desk", "r2",
       [["KF:table_small h0.7"], ["KF:table_medium h0.75", "KF:chair_B_wood F h0.95", "KF:book_single on h0.12"],
        ["F:desk h0.8", "F:chairDesk F h1.0", "F:laptop on h0.15", "KF:book_set on h0.22"],
        ["F:desk h0.85", "F:chairDesk F h1.0", "F:laptop on h0.15", "KD:candle_triple on h0.25", "KF:book_set on h0.22", "KF:pictureframe_standing_A on h0.25"]],
       ["F:lampSquareTable on h0.4", "KF:book_single on h0.1", "F:trashcan R h0.4"]),
    it("story_cabinet", "Story cabinet", "l1",
       [["KF:cabinet_small h0.6", "KF:book_single on h0.2"], ["KF:cabinet_small_decorated h0.65", "KF:book_set on h0.25"],
        ["KF:cabinet_medium_decorated h0.75", "KF:book_set on h0.25", "KD:candle on h0.2"],
        ["KF:cabinet_medium_decorated h0.8", "KF:book_set on h0.25", "KD:candle_triple on h0.3", "KH:lantern_standing R h0.6"]],
       ["KF:pillow_A F h0.2", "KF:book_single F x0.4 h0.15", "KF:cactus_small_A on h0.3"]),
    it("cozy_sofa", "Cozy sofa", "l2",
       [["KF:pillow_A h0.25", "KF:pillow_B R h0.25"], ["F:benchCushionLow h0.5"], ["KF:couch h0.8"],
        ["KF:couch_pillows h0.85", "F:lampRoundFloor R h1.6", "F:tableCoffee F h0.4"]],
       ["KF:pillow_B on h0.15", "KF:book_single F x0.5 h0.12", "KF:cactus_small_B L h0.3"]),
    it("story_wall", "Story wall", "wl", same("P:poster#words"), NOTES),
]}

ROOMS[2]["science"] = {"name": "Lab", "wallL": "#c9ead9", "wallR": "#b5e0cb", "floor": "#9c6b45",
    "decor": [win("R", 6.4), win("L", 6.6), "KF:rug_rectangle_stripes_B @4.8,5 w4 r45", "F:pottedPlant @8.45,0.5 h1.4", "KF:cactus_medium_A @0.5,8.45 h0.9"],
    "items": [
    it("fume_bench", "Fume-hood bench", "r1",
       [["KR:kitchencounter_straight_A h0.95"], ["KR:kitchencounter_straight_A_decorated h0.95", "KD:bottle_A_green on h0.3"],
        ["KR:kitchencounter_sink_backsplash h0.95", "KR:kitchencounter_straight_B_backsplash R h0.95", "P:microscope on", "KR:extractorhood top h0.6"],
        ["KR:kitchencounter_sink_backsplash h0.95", "KR:kitchencounter_straight_decorated R h0.95", "P:microscope on s1.2", "KD:bottle_A_labeled_green on h0.3", "KR:extractorhood top h0.7"]],
       ["KR:jar_A_medium on h0.25", "KD:bottle_C_green on h0.28", "F:trashcan L h0.45"]),
    it("solar_system", "Solar system model", "c",
       [["KF:table_small h0.6", "P:solar on"], ["KF:table_small h0.6", "P:solar on"], ["KF:table_medium h0.65", "P:solar on s1.4"], ["KF:table_medium h0.7", "P:solar on s1.9"]],
       ["SP:meteorHalf F x0.5 h0.2", "SP:satelliteDish F x-0.5 h0.4", "P:globe#1 L s0.6"]),
    it("rocket_pad", "Rocket launch pad", "l1",
       [["KS:landingpad_small w0.9"], ["KS:landingpad_small w1.1", "SP:spaceCraft1 on w0.6"],
        ["KS:landingpad_large w1.4", "SP:spaceCraft3 on w0.9", "SP:satelliteDish R h0.8"],
        ["KS:landingpad_large w1.6", "KS:lander_A on w0.9", "SP:satelliteDishLarge R h1.1", "SP:astronaut L h0.6"]],
       ["SP:barrel F x0.4 h0.25", "SP:rocksSmallOre F x-0.4 h0.15", "SP:robot F h0.35"]),
    it("body_model", "Human body model", "l2",
       [["KH:skull h0.3"], ["KF:table_small h0.6", "KH:skull on h0.25"], ["GV:skeleton h1.3", "KH:skull R h0.25"],
        ["GV:skeleton h1.4", "KF:cabinet_medium R h0.75", "KH:ribcage L h0.4"]],
       ["KR:jar_B_small F x0.4 h0.2", "KD:bottle_B_green F x-0.4 h0.25", "KF:book_set F h0.2"]),
    it("circuit_bench", "Circuit bench", "r2",
       [["F:table h0.75", "F:lampSquareTable on h0.4"], ["F:desk h0.8", "SP:console on h0.3", "F:lampSquareTable on h0.4"],
        ["F:desk h0.8", "SP:consoleScreen on h0.45", "SP:console on h0.3", "F:chairDesk F h1.0"],
        ["F:desk h0.85", "SP:consoleScreen on h0.5", "F:computerScreen on h0.45", "SP:console on h0.3", "F:chairDesk F h1.0", "F:speaker R h0.8"]],
       ["F:computerKeyboard on h0.05", "KS:solarpanel L h0.5", "F:speakerSmall F h0.3"]),
    it("periodic_table", "Periodic table", "wl", same("P:poster#periodic"), NOTES),
]}

ROOMS[2]["maths"] = {"name": "Maths workshop", "wallL": "#cfe0f7", "wallR": "#b9d0f0", "floor": "#9c6b45",
    "decor": [win("L", 6.8), "KF:rug_rectangle_stripes_A @4.8,5 w4 r45", "F:pottedPlant @0.5,8.45 h1.4", "P:clock @6.6,0.02 y2.1"],
    "items": [
    it("data_wall", "Data & graphs wall", "wr", same("P:poster#graph"), NOTES),
    it("geometry_tower", "Geometry tower", "c",
       [["KP:Primitive_Pillar h0.6"], ["KP:Primitive_Pillar h0.7", "KP:Primitive_Slope R h0.45"],
        ["KP:Primitive_Stairs h0.6", "KP:Primitive_Pillar L h0.9", "KP:Primitive_Slope_Half R h0.4"],
        ["KP:Primitive_Stairs h0.8", "KP:Primitive_Pillar L h1.2", "KP:Primitive_Slope_OuterCorner R h0.6", "KP:Primitive_Window F h0.6"]],
       ["KP:Primitive_Cube_Small F x0.6 h0.2", "KP:Primitive_Beam F x-0.6 h0.1", "KP:Primitive_Floor_Hole B h0.08"]),
    it("computer_station", "Computer station", "r1",
       [["F:desk h0.8", "F:laptop on h0.15"], ["F:desk h0.8", "F:computerScreen on h0.45", "F:computerKeyboard on h0.05"],
        ["F:desk h0.85", "F:computerScreen on h0.45", "F:computerScreen on h0.45", "F:chairDesk F h1.0"],
        ["F:desk h0.85", "F:computerScreen on h0.5", "F:computerScreen on h0.5", "F:laptop on h0.15", "F:chairDesk F h1.0", "F:speaker R h0.8"]],
       ["F:computerMouse on h0.04", "F:lampSquareTable on h0.4", "F:speakerSmall L h0.35"]),
    it("puzzle_cabinet", "Puzzle cabinet", "l1",
       [["F:bookcaseClosed h1.6"], ["F:bookcaseClosedDoors h1.7"], ["F:bookcaseClosedWide h1.9", "KP:Primitive_Cube_Small on h0.2"],
        ["F:bookcaseClosedWide h2.0", "KP:Primitive_Cube_Small on h0.25", "KP:Primitive_Slope_OuterCorner on h0.25", "KP:Primitive_Pillar on h0.35"]],
       ["KF:cactus_small_B F x0.4 h0.3", "KF:book_set F x-0.4 h0.2", "F:lampSquareFloor R h1.4"]),
    it("game_table", "Board game table", "l2",
       [["KF:table_small h0.6"], ["KF:table_medium h0.65", "KP:Primitive_Cube_Small on h0.1"],
        ["KF:table_medium h0.7", "KP:Primitive_Cube_Small on h0.1", "KD:coin_stack_small on h0.1", "KF:chair_A F h0.9"],
        ["KF:table_medium_long h0.75", "KP:Primitive_Cube_Small on h0.1", "KD:coin_stack_medium on h0.15", "KF:chair_A F h0.9", "KF:chair_A B h0.9"]],
       ["KF:book_single on h0.1", "KF:cactus_small_A L h0.3", "F:lampRoundTable on h0.35"]),
    it("trophy_cabinet", "Trophy cabinet", "r2",
       [["F:sideTable h0.6", "KD:coin_stack_small on h0.12"], ["KF:cabinet_medium h0.75", "KD:chest_gold on h0.25"],
        ["F:bookcaseOpen h1.9", "KD:chest_gold on h0.3", "KD:coin_stack_large on h0.25"],
        ["F:bookcaseOpen h1.9", "KD:sword_shield_gold on h0.45", "KD:chest_gold on h0.3", "KD:coin_stack_large R h0.3"]],
       ["KD:coin_stack_small F h0.1", "KD:candle_triple F x0.5 h0.25", "KF:cactus_small_B L h0.35"]),
]}

ROOMS[2]["history"] = {"name": "Museum", "wallL": "#efd3a6", "wallR": "#e5c48f", "floor": "#8e5e3c",
    "decor": ["KF:rug_rectangle_B @4.8,5 w4.2 r45", "KH:lantern_standing @8.45,0.5 h0.9", "KH:lantern_standing @0.5,8.45 h0.9"],
    "items": [
    it("castle_model", "Castle model", "c",
       [["F:tableCoffeeSquare h0.45", "HX:building_tower on w0.45"], ["KF:table_medium h0.6", "HX:building_castle on w0.6"],
        ["KF:table_medium_long h0.65", "HX:building_castle on w0.6", "HX:building_village on w0.5"],
        ["KF:table_medium_long h0.7", "HX:building_castle on w0.65", "HX:building_village on w0.5", "HX:building_wall on w0.5", "CA:flagBlue R h0.8"]],
       ["HX:unit_tower F x0.4 h0.25", "HX:unit_wallTower F x-0.4 h0.25", "CA:shieldBlue F h0.25"]),
    it("steam_train", "Steam train", "r1",
       [["HO:trainWagonFlat w0.5"], ["HO:trainLocomotive w0.6", "HO:trainTender R w0.45"],
        ["KF:table_medium_long h0.6", "HO:trainLocomotive on w0.4", "HO:trainWagon on w0.4"],
        ["KF:table_medium_long h0.65", "HO:trainLocomotive on w0.45", "HO:trainTender on w0.35", "HO:trainWagon on w0.4", "HO:lightpost R h1.2"]],
       ["KD:box_small F x0.4 h0.25", "KD:barrel_small F x-0.4 h0.25", "HO:present F h0.2"]),
    it("explorer_ship", "Explorer ship", "l1",
       [["PI:boat_small w0.6"], ["F:sideTable h0.6", "PI:ship_light on w0.5"], ["KF:cabinet_medium h0.75", "PI:ship_light on w0.7"],
        ["KF:cabinet_medium h0.8", "PI:ship_dark on w0.8", "PI:cannon R w0.4", "PI:chest L w0.4"]],
       ["PI:bottle F x0.4 h0.25", "PI:sword F x-0.4 h0.4", "P:globe#2 F s0.5"]),
    it("knight_hall", "Knight hall", "l2",
       [["CA:shieldBlue h0.4"], ["CA:knightBlue h0.8"], ["CA:knightBlue h0.85", "CA:shieldBlue L h0.4", "CA:sword R h0.5"],
        ["CA:king h0.9", "CA:knightRed L h0.85", "CA:knightBlue R h0.85"]],
       ["CA:shieldRed F x0.45 h0.3", "KH:lantern_standing F x-0.5 h0.45", "KD:sword_shield F h0.4"]),
    it("museum_vault", "Museum vault", "r2",
       [["KD:trunk_small_A h0.35"], ["KD:trunk_medium_B h0.45", "KD:pillar_decorated R h1.2"],
        ["KD:chest_gold h0.5", "KD:pillar_decorated R h1.4", "KD:pillar_decorated L h1.4"],
        ["KD:chest_gold h0.55", "KD:pillar_decorated R h1.5", "KD:pillar_decorated L h1.5", "KD:coin_stack_large F h0.3"]],
       ["KD:candle_triple F x0.6 h0.3", "GV:urn F x-0.6 h0.35", "KD:key F h0.08"]),
    it("banner_wall", "Banner wall", "wr",
       [["KD:banner_red h1.3"], ["KD:banner_red h1.4", "KD:banner_thin_blue R h1.3"],
        ["KD:banner_shield_red h1.5", "KD:banner_thin_blue R h1.4", "KD:banner_thin_red L h1.4"],
        ["KD:banner_shield_red h1.6", "KD:banner_triple_blue R h1.5", "KD:banner_triple_red L h1.5"]],
       ["CA:shieldRed on h0.3", "CA:sword on h0.4", "CA:shieldBlue on h0.3"]),
]}

ROOMS[2]["geography"] = {"name": "Explorer's den", "wallL": "#e3efc9", "wallR": "#d4e6b2", "floor": "#9c6b45",
    "decor": [win("L", 6.6), win("R", 6.6), "KF:rug_oval_B @4.8,5 w4 r45", "F:pottedPlant @8.45,0.5 h1.4"],
    "items": [
    it("grid_map", "Grid-reference map", "wr", same("P:poster#map"), NOTES),
    it("volcano_model", "Volcano model", "c",
       [["F:tableCoffeeSquare h0.45", "HX:stone on w0.45"], ["KF:table_medium h0.6", "HX:stone_hill on w0.55"],
        ["KF:table_medium h0.65", "HX:stone_mountain on w0.6", "HX:sand_rocks on w0.45"],
        ["KF:table_medium_long h0.7", "HX:stone_mountain on w0.65", "HX:stone_rocks on w0.5", "HX:water_rocks on w0.5"]],
       ["NA:rock_smallA F x0.5 h0.15", "NA:cactus_short F x-0.5 h0.35", "NA:rock_smallC F h0.12"]),
    it("resource_table", "Resource map table", "r1",
       [["F:table h0.75", "HX:grass on w0.45"], ["F:table h0.75", "HX:dirt_lumber on w0.45", "HX:water on w0.45"],
        ["KF:table_medium_long h0.75", "HX:building_mine on w0.45", "HX:building_mill on w0.45"],
        ["KF:table_medium_long h0.8", "HX:building_mine on w0.45", "HX:building_mill on w0.45", "HX:building_water on w0.45", "KS:solarpanel R h0.6"]],
       ["HX:unit_mill F x0.4 h0.25", "NA:log_stack F x-0.4 h0.2", "KS:solarpanel L h0.45"]),
    it("atlas_stand", "Atlas & compass stand", "r2",
       [["KF:cabinet_small h0.6", "KF:book_single on h0.15"], ["KF:cabinet_small h0.65", "KF:book_set on h0.22", "P:globe#1 on s0.6"],
        ["KF:cabinet_medium h0.75", "KF:book_set on h0.22", "P:globe#3 on s0.7"],
        ["KF:cabinet_medium_decorated h0.8", "P:globe#4 R s1.6", "KF:book_set on h0.25", "KH:lantern_standing L h0.5"]],
       ["KF:book_single F x0.4 h0.15", "KF:cactus_small_A F x-0.4 h0.3", "NA:flower_purpleA F h0.2"]),
    it("rock_cabinet", "Rock & fossil cabinet", "l1",
       [["NA:rock_smallC h0.25"], ["F:sideTable h0.6", "NA:rock_largeA on w0.35"],
        ["F:bookcaseOpenLow h0.95", "NA:stone_largeA on w0.3", "SP:rocksOre on h0.25", "KH:bone_A on h0.15"],
        ["F:bookcaseOpen h1.9", "SP:rocksTallOre on h0.3", "NA:stone_tallB on h0.3", "KH:skull R h0.3", "NA:rock_largeB L w0.5"]],
       ["NA:rock_smallB F x0.4 h0.12", "NA:stone_smallB F x-0.4 h0.12", "KH:bone_B F h0.1"]),
    it("climate_garden", "Climate-zone garden", "l2",
       [["NA:cactus_short h0.5"], ["NA:cactus_short h0.5", "NA:cactus_tall R h0.8"],
        ["NA:tree_palmShort h1.0", "NA:cactus_tall R h0.8", "NA:tree_pineSmallA L h0.8"],
        ["NA:tree_palmTall h1.5", "NA:cactus_tall R h0.9", "NA:tree_pineSmallA L h0.9", "NA:tree_small_fall F h0.8"]],
       ["NA:flower_redA F x0.6 h0.2", "NA:mushroom_redGroup F x-0.6 h0.15", "NA:flower_yellowA B h0.2"]),
]}

ROOMS[2]["english"] = {"name": "Reading nook", "wallL": "#f0cfe0", "wallR": "#e6bcd2", "floor": "#9c6b45",
    "decor": [win("R", 6.8), "KF:rug_oval_A @4.8,5 w4", "F:pottedPlant @0.5,8.45 h1.4"],
    "items": [
    it("library_wall", "Library wall", "r1",
       [["F:bookcaseOpen h1.8"], ["F:bookcaseOpen h1.9", "KF:book_set on h0.25"], ["F:bookcaseOpen h1.9", "F:bookcaseOpen R h1.9", "KF:book_set on h0.25"],
        ["F:bookcaseOpen h2.0", "F:bookcaseOpen R h2.0", "F:bookcaseOpen L h2.0", "KF:book_set on h0.25"]],
       ["KF:cactus_small_A on h0.3", "KF:book_set F h0.2", "F:lampSquareFloor F x0.8 h1.4"]),
    it("reading_table", "Reading table", "c",
       [["KF:table_medium h0.7"], ["KF:table_medium_long h0.75", "KF:book_set on h0.2"],
        ["KF:table_medium_long h0.75", "KF:book_set on h0.2", "KD:candle on h0.2", "KF:chair_B_wood F h0.95"],
        ["KF:table_medium_long h0.8", "KF:book_set on h0.22", "KD:candle_triple on h0.28", "KF:book_single on h0.12", "KF:chair_B_wood F h0.95", "KF:chair_B_wood B h0.95"]],
       ["KF:pillow_A L h0.2", "KF:book_single F x0.6 h0.12", "F:lampRoundTable on h0.35"]),
    it("lounge_sofa", "Lounge sofa", "l1",
       [["KF:chair_C h0.95"], ["KF:couch h0.8"], ["KF:couch_pillows h0.85"], ["KF:couch_pillows h0.9", "F:lampRoundFloor R h1.6", "F:tableCoffeeGlass F h0.4"]],
       ["KF:pillow_B on h0.15", "KF:book_single F x0.5 h0.12", "KF:cactus_small_B L h0.3"]),
    it("author_desk", "Author desk", "r2",
       [["KF:table_small h0.7", "KF:book_single on h0.12"], ["F:desk h0.8", "F:laptop on h0.15", "KF:chair_B_wood F h0.95"],
        ["F:desk h0.85", "F:laptop on h0.15", "F:computerScreen on h0.45", "F:chairDesk F h1.0"],
        ["F:desk h0.85", "F:computerScreen on h0.45", "F:laptop on h0.15", "KD:candle_triple on h0.28", "F:chairDesk F h1.0", "F:bookcaseOpenLow R h1.0"]],
       ["F:lampSquareTable on h0.4", "KF:book_set on h0.2", "F:trashcan L h0.4"]),
    it("listening_corner", "Listening corner", "l2",
       [["F:radio h0.3"], ["F:sideTable h0.6", "F:radio on h0.3"], ["F:cabinetTelevision h0.6", "F:televisionVintage on h0.5"],
        ["F:cabinetTelevisionDoors h0.65", "F:televisionModern on h0.6", "F:speaker L h0.9", "F:speaker R h0.9"]],
       ["F:speakerSmall on h0.2", "KF:pillow_A F h0.2", "KF:cactus_small_A F x0.6 h0.3"]),
    it("metaphor_wall", "Simile & metaphor wall", "wl", same("P:poster#words"), NOTES),
]}

import re
for r in ROOMS[2].values():
    r["decor"] = [re.sub(r"@([\d.]+),([\d.]+)", lambda m: "@%.2f,%.2f" % (float(m.group(1)) * 8 / 9, float(m.group(2)) * 8 / 9), d) for d in r["decor"]]

if __name__ == "__main__":
    json.dump({"tiers": TIERS, "order": ROOM_ORDER, "rooms": ROOMS}, open("catalog.json", "w"), indent=1)
    models = json.load(open("models.json"))
    miss = set()
    for t in ROOMS:
        for r in ROOMS[t].values():
            parts = list(r["decor"])
            for i in r["items"]:
                parts += [p for s in i["stages"] for p in s] + i["addons"]
            for p in parts:
                m = p.split()[0]
                if not m.startswith("P:") and m not in models:
                    miss.add(m)
    print("items", sum(len(r["items"]) for t in ROOMS for r in ROOMS[t].values()), "missing", sorted(miss))
