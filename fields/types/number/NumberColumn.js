import React from "react";
import numeral from "numeral";
import "whatwg-fetch";
import FormData from "form-data";
import ItemsTableCell from "../../components/ItemsTableCell";
import ItemsTableValue from "../../components/ItemsTableValue";
import { FormInput } from "../../../admin/client/App/elemental";

var NumberColumn = React.createClass({
	displayName: "NumberColumn",
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
	},
	getInitialState() {
		return {
			value: null,
			editing: false,
			color: "black",
		};
	},
	value() {
		return this.state.value || this.props.data.fields[this.props.col.path];
	},
	renderValue() {
		const value = this.value();
		if (!value || isNaN(value)) return null;
		const formattedValue =
			this.props.col.path === "money"
				? numeral(value).format("$0,0.00")
				: value;

		if (this.state.editing) {
			return (
				<FormInput
					autoComplete="off"
					onChange={this.onChange.bind(this)}
					onBlur={this.onBlur.bind(this)}
					onKeyPress={this.onKeyPress.bind(this)}
					ref={(input) => {
						if (input && this.shouldSelect) {
							input.select();
							this.shouldSelect = false;
						}
					}}
					value={value}
				/>
			);
		} else {
			return formattedValue;
		}
	},
	onKeyPress(event) {
		if (event.nativeEvent && event.nativeEvent.code === "Enter") {
			this.onBlur();
		}
	},
	onChange(event) {
		this.setState({ value: event.target.value });
	},
	onClick() {
		this.shouldSelect = true;
		this.setState({ editing: true });
	},
	onBlur() {
		const url = `/keystone/api/${this.props.list.path}/${this.props.data.id}`;
		var form = new FormData();
		form.append(this.props.col.path, this.value());
		fetch(url, { method: "POST", body: form, credentials: "same-origin" }).then(
			(response) => {
				response.json().then((json) => {
					if (json.error) {
						this.setState({ color: "red" });
					} else {
						this.setState({ color: "green" });
					}
				});
			}
		);
		this.setState({ editing: false });
	},
	render() {
		return (
			<ItemsTableCell onClick={this.onClick.bind(this)}>
				<ItemsTableValue
					field={this.props.col.type}
					style={{ color: this.state.color }}
				>
					{this.renderValue()}
				</ItemsTableValue>
			</ItemsTableCell>
		);
	},
});

module.exports = NumberColumn;
